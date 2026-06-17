import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { DriversService } from "../drivers/drivers.service";
import { ListDriversQueryDto } from "../drivers/dto/list-drivers-query.dto";
import { IncidentsService } from "../incidents/incidents.service";
import { ListIncidentsQueryDto } from "../incidents/dto/list-incidents-query.dto";
import { LoadsService } from "../loads/loads.service";
import { ListLoadsQueryDto } from "../loads/dto/list-loads-query.dto";
import { toDriverDetailsSummary } from "./internal/assistant-driver-summary";
import { uuidPattern } from "./internal/assistant.constants";
import { parseToolArguments } from "./internal/assistant-openai";
import {
  getOptionalBoolean,
  getOptionalDateString,
  getOptionalLimit,
  getOptionalString,
  normalizeIncidentSearchQuery,
} from "./internal/assistant-tool-input";
import type {
  IncidentDetailsInput,
  ToolCall,
  ToolResult,
} from "./internal/assistant.types";

@Injectable()
export class AssistantToolsService {
  constructor(
    private readonly driversService: DriversService,
    private readonly incidentsService: IncidentsService,
    private readonly loadsService: LoadsService,
  ) {}

  /**
   * Executes an assistant tool call based on the function name.
   * Routes to the appropriate search or details method.
   *
   * @param functionCall - The tool call with name and arguments
   * @returns Promise resolving to the tool result with optional linked entity
   */
  async executeTool(functionCall: ToolCall): Promise<ToolResult> {
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
        throw new InternalServerErrorException(
          "Unsupported assistant tool call",
        );
    }
  }

  /**
   * Searches for loads based on the provided input parameters.
   * Returns a linked entity if exactly one load matches.
   *
   * @param input - The search parameters from tool arguments
   * @returns Promise resolving to the search result with optional linked entity
   */
  private async searchLoads(
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    const query = new ListLoadsQueryDto();
    query.search = getOptionalString(input.search);
    query.status = getOptionalString(
      input.status,
    ) as ListLoadsQueryDto["status"];
    query.driverId = getOptionalString(input.driverId);
    query.pickupFrom = getOptionalDateString(input.pickupFrom);
    query.pickupTo = getOptionalDateString(input.pickupTo);
    query.page = 1;
    query.limit = getOptionalLimit(input.limit);

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
          deliveryAddress: load.deliveryAddress,
          deliveryDate: load.deliveryDate,
          id: load.id,
          miles: load.miles,
          pickupAddress: load.pickupAddress,
          pickupDate: load.pickupDate,
          referenceNumber: load.referenceNumber,
          status: load.status,
          driver: load.driver
            ? `${load.driver.firstName} ${load.driver.lastName}`.trim()
            : null,
          driverCode: load.driver?.truckNumber ?? null,
        })),
      },
    };
  }

  /**
   * Searches for drivers based on the provided input parameters.
   * Returns a linked entity if exactly one driver matches.
   *
   * @param input - The search parameters from tool arguments
   * @returns Promise resolving to the search result with optional linked entity
   */
  private async searchDrivers(
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    const query = new ListDriversQueryDto();
    query.search = getOptionalString(input.search);
    query.status = getOptionalString(
      input.status,
    ) as ListDriversQueryDto["status"];
    query.truckNumber = getOptionalString(input.truckNumber);
    query.trailerNumber = getOptionalString(input.trailerNumber);
    query.isActive = getOptionalBoolean(input.isActive);
    query.page = 1;
    query.limit = getOptionalLimit(input.limit);

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
   * Searches for incidents based on the provided input parameters.
   * Returns a linked entity if exactly one incident matches.
   *
   * @param input - The search parameters from tool arguments
   * @returns Promise resolving to the search result with optional linked entity
   */
  private async searchIncidents(
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    const query = new ListIncidentsQueryDto();
    query.search = getOptionalString(input.search);
    query.type = getOptionalString(input.type) as ListIncidentsQueryDto["type"];
    query.priority = getOptionalString(
      input.priority,
    ) as ListIncidentsQueryDto["priority"];
    query.status = getOptionalString(
      input.status,
    ) as ListIncidentsQueryDto["status"];
    query.driverId = getOptionalString(input.driverId);
    query.loadId = getOptionalString(input.loadId);
    query.page = 1;
    query.limit = getOptionalLimit(input.limit);
    normalizeIncidentSearchQuery(query);

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
   * Retrieves detailed information for a specific load by ID.
   *
   * @param input - The input containing loadId
   * @returns Promise resolving to the load details with linked entity
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
   * Retrieves detailed information for a specific driver by ID.
   * Supports resolving driver identifiers (UUID, driver code, or name).
   *
   * @param input - The input containing driverId
   * @returns Promise resolving to the driver details with linked entity
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
   * Retrieves detailed information for a specific incident by ID.
   *
   * @param input - The input containing incidentId
   * @returns Promise resolving to the incident details with linked entity
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
   * Generates read-only recommended next steps for an incident.
   * Builds escalation level and context-specific guidance based on incident priority, status, and type.
   *
   * @param input - The input containing incidentId and optional focus area
   * @returns Promise resolving to the incident guidance with linked entity
   */
  private async generateIncidentGuidance(
    input: Record<string, unknown>,
  ): Promise<ToolResult> {
    const incidentId = this.requireString(input.incidentId, "incidentId");
    const focus = getOptionalString(input.focus);
    const response = await this.incidentsService.findOne(incidentId);
    const incident = response.data;

    const nextSteps = this.buildIncidentNextSteps(incident, focus);
    const escalation = this.getIncidentEscalation(
      incident.priority,
      incident.status,
    );

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
   * Builds a list of recommended next steps for an incident.
   * Steps are customized based on incident priority, status, and optional focus area.
   *
   * @param incident - The incident details
   * @param focus - Optional focus area (e.g., 'driver', 'customer')
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
      steps.push(
        "Assign an owner and move the incident into active investigation.",
      );
    }

    if (
      incident.status === "investigating" ||
      incident.status === "monitoring"
    ) {
      steps.push(
        "Capture the next expected update time so the team knows when to re-check the incident.",
      );
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
   * Based on priority and status combinations.
   *
   * @param priority - The incident priority
   * @param status - The incident status
   * @returns The escalation level: 'urgent', 'ops_manager', or 'monitor'
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
   * Resolves a driver identifier to a UUID.
   * Supports UUIDs, driver codes, and full names. Performs search for non-UUID identifiers.
   *
   * @param identifier - The driver identifier (UUID, code, or name)
   * @returns Promise resolving to the driver UUID
   * @throws NotFoundException if driver is not found or multiple matches exist
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
      const fullName = `${driver.firstName} ${driver.lastName}`
        .trim()
        .toLowerCase();
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
   * Validates that a value is a non-empty string and returns it trimmed.
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
}
