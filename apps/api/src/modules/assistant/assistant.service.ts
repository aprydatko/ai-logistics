import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { eq } from "drizzle-orm";

import type { Environment } from "../../config/environment";
import { DatabaseService } from "../../db/database.service";
import { users } from "../../db/schema";
import { AiLogsService } from "../ai-logs/ai-logs.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { DriversService } from "../drivers/drivers.service";
import { ListDriversQueryDto } from "../drivers/dto/list-drivers-query.dto";
import { IncidentsService } from "../incidents/incidents.service";
import { ListIncidentsQueryDto } from "../incidents/dto/list-incidents-query.dto";
import { LoadsService } from "../loads/loads.service";
import { ListLoadsQueryDto } from "../loads/dto/list-loads-query.dto";
import type {
  AssistantResponseDto,
  CreateAssistantMessageDto,
} from "./dto/create-assistant-message.dto";
import { supportedModels, toolDefinitions, uuidPattern } from "./internal/assistant.constants";
import { toDriverDetailsSummary } from "./internal/assistant-driver-summary";
import {
  buildInstructions,
  buildOpenAIInput,
  buildRequestInputLog,
  estimateCostUsd,
  extractFunctionCalls,
  extractOutputText,
  getOpenAIUsage,
  getResponseId,
  parseToolArguments,
} from "./internal/assistant-openai";
import type {
  AssistantLinkedEntity,
  AssistantReportType,
  AssistantToolName,
  CreateAiLogDto,
  IncidentDetailsInput,
  OpenAIResponseBody,
  ToolCall,
  ToolResult,
} from "./internal/assistant.types";

@Injectable()
export class AssistantService {
  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly aiLogsService: AiLogsService,
    private readonly databaseService: DatabaseService,
    private readonly driversService: DriversService,
    private readonly incidentsService: IncidentsService,
    private readonly loadsService: LoadsService,
  ) {}

  /**
   * Main entry point for assistant requests. Processes user messages,
   * executes tools, and returns AI responses.
   *
   * @param dto - The assistant message request DTO
   * @param user - The authenticated user making the request
   * @returns Promise resolving to the assistant response
   */
  async respond(
    dto: CreateAssistantMessageDto,
    user: AuthenticatedUser,
  ): Promise<AssistantResponseDto> {
    const startedAt = Date.now();
    const model = this.resolveModel(dto.model);
    const conversationId = dto.conversationId ?? crypto.randomUUID();
    const requestInput = buildRequestInputLog(dto);
    const reportType = this.detectReportType(dto.message);
    const userName = await this.getUserDisplayName(user);

    if (!this.configService.get("OPENAI_API_KEY", { infer: true })) {
      await this.logAssistantCall({
        errorMessage: "OpenAI API key is not configured",
        latencyMs: Date.now() - startedAt,
        model,
        operation: dto.operation ?? this.detectOperation(dto.message, [], reportType),
        requestInput,
        source: dto.source ?? "web",
        status: "failed",
        userId: user.id,
        userName,
      });

      return {
        conversationId,
        message:
          "Assistant OpenAI setup is ready. Add OPENAI_API_KEY to apps/web/.env.local to enable real responses.",
        request: {
          message: dto.message,
          model,
        },
        status: "placeholder",
      };
    }

    try {
      const usedTools = new Set<AssistantToolName>();
      let resolvedEntity: AssistantLinkedEntity | undefined = dto.linkedEntity;
      let responseBody = await this.requestOpenAI({
        input: buildOpenAIInput(dto),
        instructions: buildInstructions(dto.linkedEntity),
        model,
        tools: toolDefinitions,
      });

      let responseId = getResponseId(responseBody);

      while (true) {
        const functionCalls = extractFunctionCalls(responseBody);
        if (functionCalls.length === 0) {
          break;
        }

        if (!responseId) {
          throw new InternalServerErrorException(
            "OpenAI tool response is missing a response id",
          );
        }

        const toolOutputs = [];
        for (const functionCall of functionCalls) {
          const result = await this.executeTool(functionCall);
          usedTools.add(functionCall.name);
          if (result.linkedEntity) {
            resolvedEntity = result.linkedEntity;
          }
          toolOutputs.push({
            type: "function_call_output",
            call_id: functionCall.callId,
            output: JSON.stringify(result.output),
          });
        }

        responseBody = await this.requestOpenAI({
          input: toolOutputs,
          model,
          previous_response_id: responseId,
        });
        responseId = getResponseId(responseBody);
      }

      const usage = getOpenAIUsage(responseBody);
      const assistantMessage = extractOutputText(responseBody);
      if (!assistantMessage) {
        throw new InternalServerErrorException(
          "OpenAI returned an empty response",
        );
      }

      const operation =
        dto.operation ??
        this.detectOperation(dto.message, [...usedTools], reportType);

      await this.logAssistantCall({
        latencyMs: Date.now() - startedAt,
        linkedEntity: resolvedEntity,
        model,
        operation,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estimatedCostUsd: estimateCostUsd({
          completionTokens: usage.completionTokens,
          model,
          promptTokens: usage.promptTokens,
        }),
        providerRequestId: responseId,
        requestInput,
        responseOutput: assistantMessage,
        source: dto.source ?? "web",
        status: "success",
        userId: user.id,
        userName,
      });

      return {
        conversationId,
        linkedEntity: resolvedEntity,
        message: assistantMessage,
        reportType,
        request: {
          message: dto.message,
          model,
        },
        status: "configured",
        usedTools: [...usedTools],
      };
    } catch (error: unknown) {
      const message = this.normalizeErrorMessage(error);
      await this.logAssistantCall({
        errorMessage: message,
        latencyMs: Date.now() - startedAt,
        model,
        operation: dto.operation ?? this.detectOperation(dto.message, [], reportType),
        requestInput,
        source: dto.source ?? "web",
        status: "failed",
        userId: user.id,
        userName,
      });

      return {
        conversationId,
        message,
        request: {
          message: dto.message,
          model,
        },
        status: "error",
      };
    }
  }

  /**
   * Resolves the OpenAI model to use, falling back to configured model or default.
   *
   * @param requestedModel - The model requested by the client
   * @returns The resolved model name
   */
  private resolveModel(requestedModel?: string): string {
    if (requestedModel && supportedModels.has(requestedModel)) {
      return requestedModel;
    }

    const configuredModel = this.configService.get("OPENAI_MODEL", {
      infer: true,
    });
    return supportedModels.has(configuredModel) ? configuredModel : "gpt-4.1-mini";
  }

  /**
   * Executes a tool call and returns the result.
   *
   * @param functionCall - The tool call to execute
   * @returns Promise resolving to the tool result
   */
  private async executeTool(functionCall: ToolCall): Promise<ToolResult> {
    const parsedArguments = parseToolArguments(functionCall.arguments);

    switch (functionCall.name) {
      case "search_loads":
        return this.searchLoads(parsedArguments);
      case "search_drivers":
        return this.searchDrivers(parsedArguments);
      case "search_incidents":
        return this.searchIncidents(parsedArguments);
      case "get_load_details":
        return this.getLoadDetails(parsedArguments);
      case "get_driver_details":
        return this.getDriverDetails(parsedArguments);
      case "get_incident_details":
        return this.getIncidentDetails(parsedArguments);
      case "generate_incident_guidance":
        return this.generateIncidentGuidance(parsedArguments);
      default:
        throw new InternalServerErrorException("Unsupported assistant tool call");
    }
  }

  /**
   * Searches for loads based on provided filters.
   *
   * @param input - Tool input parameters
   * @returns Promise resolving to search results
   */
  private async searchLoads(
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    const query = new ListLoadsQueryDto();
    query.search = this.getOptionalString(input.search);
    query.status = this.getOptionalString(input.status) as ListLoadsQueryDto["status"];
    query.driverId = this.getOptionalString(input.driverId);
    query.pickupFrom = this.getOptionalString(input.pickupFrom);
    query.pickupTo = this.getOptionalString(input.pickupTo);
    query.page = 1;
    query.limit = this.getOptionalLimit(input.limit);

    const response = await this.loadsService.findAll(query);
    const firstLoad = response.data[0];

    return {
      linkedEntity:
        response.data.length === 1 && firstLoad
          ? {
              type: "load",
              recordId: firstLoad.id,
              title: firstLoad.referenceNumber,
              route: "/loads",
            }
          : undefined,
      output: {
        count: response.data.length,
        items: response.data.map((load) => ({
          id: load.id,
          referenceNumber: load.referenceNumber,
          status: load.status,
          pickupAddress: load.pickupAddress,
          deliveryAddress: load.deliveryAddress,
          pickupDate: load.pickupDate,
          deliveryDate: load.deliveryDate,
          miles: load.miles,
          driver: load.driver
            ? `${load.driver.firstName} ${load.driver.lastName}`.trim()
            : null,
        })),
      },
    };
  }

  /**
   * Searches for drivers based on provided filters.
   *
   * @param input - Tool input parameters
   * @returns Promise resolving to search results
   */
  private async searchDrivers(
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    const query = new ListDriversQueryDto();
    query.search = this.getOptionalString(input.search);
    query.status = this.getOptionalString(input.status) as ListDriversQueryDto["status"];
    query.truckNumber = this.getOptionalString(input.truckNumber);
    query.trailerNumber = this.getOptionalString(input.trailerNumber);
    query.isActive = this.getOptionalBoolean(input.isActive);
    query.page = 1;
    query.limit = this.getOptionalLimit(input.limit);

    const response = await this.driversService.findAll(query);
    const firstDriver = response.data[0];

    return {
      linkedEntity:
        response.data.length === 1 && firstDriver
          ? {
              type: "driver",
              recordId: firstDriver.id,
              title: `${firstDriver.firstName} ${firstDriver.lastName}`.trim(),
              route: `/drivers/${firstDriver.id}`,
            }
          : undefined,
      output: {
        count: response.data.length,
        items: response.data.map((driver) => ({
          id: driver.id,
          driverCode: driver.driverCode,
          firstName: driver.firstName,
          lastName: driver.lastName,
          status: driver.status,
          isActive: driver.isActive,
          truckNumber: driver.truckNumber,
          trailerNumber: driver.trailerNumber,
        })),
      },
    };
  }

  /**
   * Searches for incidents based on provided filters.
   *
   * @param input - Tool input parameters
   * @returns Promise resolving to search results
   */
  private async searchIncidents(
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    const query = new ListIncidentsQueryDto();
    query.search = this.getOptionalString(input.search);
    query.type = this.getOptionalString(input.type) as ListIncidentsQueryDto["type"];
    query.priority = this.getOptionalString(input.priority) as ListIncidentsQueryDto["priority"];
    query.status = this.getOptionalString(input.status) as ListIncidentsQueryDto["status"];
    query.driverId = this.getOptionalString(input.driverId);
    query.loadId = this.getOptionalString(input.loadId);
    query.page = 1;
    query.limit = this.getOptionalLimit(input.limit);

    const response = await this.incidentsService.findAll(query);
    const firstIncident = response.data[0];

    return {
      linkedEntity:
        response.data.length === 1 && firstIncident
          ? {
              type: "incident",
              recordId: firstIncident.id,
              title: firstIncident.title,
              route: `/incidents/${firstIncident.id}`,
            }
          : undefined,
      output: {
        count: response.data.length,
        items: response.data.map((incident) => ({
          id: incident.id,
          title: incident.title,
          type: incident.type,
          priority: incident.priority,
          status: incident.status,
          loadReferenceNumber: incident.load.referenceNumber,
          driver: incident.load.driver
            ? `${incident.load.driver.firstName} ${incident.load.driver.lastName}`.trim()
            : null,
          occurredAt: incident.occurredAt,
        })),
      },
    };
  }

  /**
   * Retrieves detailed information for a specific load.
   *
   * @param input - Tool input parameters containing loadId
   * @returns Promise resolving to load details
   */
  private async getLoadDetails(
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    const loadId = this.requireString(input.loadId, "loadId");
    const response = await this.loadsService.findById(loadId);

    return {
      linkedEntity: {
        type: "load",
        recordId: response.data.id,
        title: response.data.referenceNumber,
        route: `/loads/${response.data.id}`,
      },
      output: {
        load: response.data,
      },
    };
  }

  /**
   * Retrieves detailed information for a specific driver.
   * Supports both UUID and driver code as identifier.
   *
   * @param input - Tool input parameters containing driverId
   * @returns Promise resolving to driver details
   */
  private async getDriverDetails(
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    const driverId = await this.resolveDriverIdentifier(
      this.requireString(input.driverId, "driverId"),
    );
    const response = await this.driversService.findById(driverId);

    return {
      linkedEntity: {
        type: "driver",
        recordId: response.data.id,
        title: `${response.data.firstName} ${response.data.lastName}`.trim(),
        route: `/drivers/${response.data.id}`,
      },
      output: {
        driver: toDriverDetailsSummary(response),
      },
    };
  }

  /**
   * Retrieves detailed information for a specific incident.
   *
   * @param input - Tool input parameters containing incidentId
   * @returns Promise resolving to incident details
   */
  private async getIncidentDetails(
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    const incidentId = this.requireString(input.incidentId, "incidentId");
    const response = await this.incidentsService.findOne(incidentId);

    return {
      linkedEntity: {
        type: "incident",
        recordId: response.data.id,
        title: response.data.title,
        route: `/incidents/${response.data.id}`,
      },
      output: {
        incident: response.data,
      },
    };
  }

  /**
   * Generates recommended next steps for an incident based on its current state.
   *
   * @param input - Tool input parameters containing incidentId and optional focus
   * @returns Promise resolving to incident guidance
   */
  private async generateIncidentGuidance(
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    const incidentId = this.requireString(input.incidentId, "incidentId");
    const focus = this.getOptionalString(input.focus);
    const response = await this.incidentsService.findOne(incidentId);
    const incident = response.data;

    const nextSteps = this.buildIncidentNextSteps(incident, focus);
    const escalation = this.getIncidentEscalation(incident.priority, incident.status);

    return {
      linkedEntity: {
        type: "incident",
        recordId: incident.id,
        title: incident.title,
        route: `/incidents/${incident.id}`,
      },
      output: {
        incidentId: incident.id,
        summary: `${incident.title} for load ${incident.load.referenceNumber} is currently ${incident.status}.`,
        escalation,
        nextSteps,
      },
    };
  }

  /**
   * Builds contextual next steps for an incident based on its properties.
   *
   * @param incident - The incident data
   * @param focus - Optional focus area (e.g., "driver", "customer")
   * @returns Array of recommended next steps
   */
  private buildIncidentNextSteps(
    incident: IncidentDetailsInput,
    focus?: string,
  ): string[] {
    const steps = [
      "Confirm the latest timeline entry and driver status before coordinating next actions.",
      "Notify the dispatcher and affected stakeholders with the current load and ETA impact.",
    ];

    if (incident.priority === "critical" || incident.type === "accident") {
      steps.push(
        "Escalate immediately to operations leadership and verify safety/compliance procedures were started.",
      );
    }

    if (incident.status === "open") {
      steps.push("Assign an owner and move the incident into active investigation.");
    }

    if (incident.status === "investigating" || incident.status === "monitoring") {
      steps.push("Capture the next expected update time so the team knows when to re-check the incident.");
    }

    if (focus?.toLowerCase().includes("driver")) {
      steps.push(
        "Verify whether the assigned driver can continue, needs roadside support, or requires a replacement plan.",
      );
    }

    if (focus?.toLowerCase().includes("customer")) {
      steps.push(
        "Prepare a customer-facing summary with impact, mitigation, and the next update window.",
      );
    }

    return steps;
  }

  /**
   * Determines the appropriate escalation level for an incident.
   *
   * @param priority - The incident priority
   * @param status - The incident status
   * @returns Escalation level
   */
  private getIncidentEscalation(
    priority: IncidentDetailsInput["priority"],
    status: IncidentDetailsInput["status"],
  ): "monitor" | "ops_manager" | "urgent" {
    if (priority === "critical" || status === "investigating") {
      return "urgent";
    }
    if (priority === "high") {
      return "ops_manager";
    }
    return "monitor";
  }

  /**
   * Resolves a driver identifier to a UUID. Accepts UUID, driver code, or full name.
   *
   * @param identifier - The driver identifier (UUID, code, or name)
   * @returns Promise resolving to the driver UUID
   * @throws NotFoundException if driver not found or multiple matches
   */
  private async resolveDriverIdentifier(identifier: string): Promise<string> {
    const normalizedIdentifier = identifier.trim();

    if (uuidPattern.test(normalizedIdentifier)) {
      return normalizedIdentifier;
    }

    const query = new ListDriversQueryDto();
    query.search = normalizedIdentifier;
    query.page = 1;
    query.limit = 5;

    const response = await this.driversService.findAll(query);
    const normalizedSearch = normalizedIdentifier.toLowerCase();
    const exactDriver = response.data.find((driver) => {
      const fullName = `${driver.firstName} ${driver.lastName}`.trim().toLowerCase();
      return (
        driver.driverCode.toLowerCase() === normalizedSearch ||
        fullName === normalizedSearch
      );
    });

    if (exactDriver) {
      return exactDriver.id;
    }

    const firstDriver = response.data[0];
    if (response.data.length === 1 && firstDriver) {
      return firstDriver.id;
    }

    if (response.data.length > 1) {
      throw new NotFoundException(
        `Multiple drivers matched "${identifier}". Please use the driver code or open the driver from search results first.`,
      );
    }

    throw new NotFoundException(`Driver "${identifier}" was not found.`);
  }

  /**
   * Makes a request to the OpenAI API.
   *
   * @param body - The request body
   * @returns Promise resolving to the OpenAI response
   * @throws InternalServerErrorException if the request fails
   */
  private async requestOpenAI(
    body: Record<string, unknown>,
  ): Promise<OpenAIResponseBody> {
    const apiKey = this.configService.get("OPENAI_API_KEY", { infer: true });
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseBody =
      ((await response.json().catch(() => null)) as OpenAIResponseBody | null) ??
      {};

    if (!response.ok) {
      throw new InternalServerErrorException(
        responseBody.error?.message || "OpenAI request failed.",
      );
    }

    return responseBody;
  }

  /**
   * Detects the type of report being requested from the user message.
   *
   * @param message - The user message
   * @returns The detected report type or undefined
   */
  private detectReportType(message: string): AssistantReportType | undefined {
    const normalized = message.toLowerCase();
    if (
      !normalized.includes("report") &&
      !normalized.includes("summary") &&
      !normalized.includes("brief")
    ) {
      return undefined;
    }

    if (normalized.includes("incident")) return "incidents";
    if (normalized.includes("driver")) return "drivers";
    if (normalized.includes("load")) return "loads";
    if (normalized.includes("operations")) return "operations";
    return "general";
  }

  /**
   * Detects the operation type based on message content and tools used.
   *
   * @param message - The user message
   * @param usedTools - Array of tools that were used
   * @param reportType - Optional detected report type
   * @returns The operation type string
   */
  private detectOperation(
    message: string,
    usedTools: string[],
    reportType?: AssistantReportType,
  ): string {
    const normalized = message.toLowerCase();
    if (reportType) {
      return `report:${reportType}`;
    }

    if (
      usedTools.includes("generate_incident_guidance") ||
      normalized.includes("incident") ||
      normalized.includes("accident") ||
      normalized.includes("delay")
    ) {
      return "incident_guidance";
    }

    return "chat";
  }

  /**
   * Retrieves the display name for a user from the database or falls back to email.
   *
   * @param user - The authenticated user
   * @returns Promise resolving to the user's display name
   */
  private async getUserDisplayName(user: AuthenticatedUser): Promise<string> {
    const [dbUser] = await this.databaseService.client
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser) {
      return user.email;
    }

    const fullName = `${dbUser.firstName} ${dbUser.lastName}`.trim();
    return fullName || user.email;
  }

  /**
   * Logs an assistant call to the AI logs service. Errors are silently ignored to not break responses.
   *
   * @param payload - The log entry payload
   */
  private async logAssistantCall(payload: CreateAiLogDto): Promise<void> {
    try {
      await this.aiLogsService.create(payload);
    } catch {
      // Logging should not break assistant responses.
    }
  }

  /**
   * Normalizes an error to a user-friendly message string.
   *
   * @param error - The error to normalize
   * @returns User-friendly error message
   */
  private normalizeErrorMessage(error: unknown): string {
    if (error instanceof NotFoundException) {
      const message = error.message.trim();
      return message || "Requested logistics record was not found.";
    }

    if (error instanceof Error) {
      const message = error.message.trim();
      return message || "Assistant service unavailable";
    }

    return "Assistant service unavailable";
  }

  /**
   * Requires a string value and throws if invalid.
   *
   * @param value - The value to validate
   * @param field - The field name for error message
   * @returns The trimmed string value
   * @throws InternalServerErrorException if value is invalid
   */
  private requireString(value: unknown, field: string): string {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    throw new InternalServerErrorException(
      `Assistant tool argument "${field}" is required`,
    );
  }

  /**
   * Safely extracts an optional string value.
   *
   * @param value - The value to extract
   * @returns Trimmed string or undefined
   */
  private getOptionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  /**
   * Safely extracts an optional boolean value.
   *
   * @param value - The value to extract
   * @returns Boolean or undefined
   */
  private getOptionalBoolean(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
  }

  /**
   * Safely extracts and clamps a limit value between 1 and 5.
   *
   * @param value - The value to extract
   * @returns Clamped limit value (1-5)
   */
  private getOptionalLimit(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value)
      ? Math.max(1, Math.min(5, Math.trunc(value)))
      : 5;
  }
}
