import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Environment } from "../../config/environment";
import type { AuthenticatedUser } from "../auth/auth.types";
import { AssistantAuditService } from "./assistant-audit.service";
import type {
  AssistantResponseDto,
  CreateAssistantMessageDto,
} from "./dto/create-assistant-message.dto";
import {
  supportedModels,
  toolDefinitions,
} from "./internal/assistant.constants";
import {
  detectOperation,
  detectReportType,
} from "./internal/assistant-classification";
import { runAssistantOrchestration } from "./internal/assistant-orchestrator";
import {
  buildInstructions,
  buildOpenAIInput,
  buildRequestInputLog,
  estimateCostUsd,
} from "./internal/assistant-openai";
import { AssistantOpenAIClient } from "./internal/assistant-openai-client";
import { AssistantToolsService } from "./assistant-tools.service";

@Injectable()
export class AssistantService {
  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly assistantAuditService: AssistantAuditService,
    private readonly assistantOpenAIClient: AssistantOpenAIClient,
    private readonly assistantToolsService: AssistantToolsService,
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
    const reportType = detectReportType(dto.message);
    const userName = await this.assistantAuditService.getUserDisplayName(user);

    if (!this.configService.get("OPENAI_API_KEY", { infer: true })) {
      await this.assistantAuditService.logAssistantCall({
        errorMessage: "OpenAI API key is not configured",
        latencyMs: Date.now() - startedAt,
        model,
        operation:
          dto.operation ??
          detectOperation({ message: dto.message, reportType, usedTools: [] }),
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
      const initialResponse = await this.assistantOpenAIClient.request({
        input: buildOpenAIInput(dto),
        instructions: buildInstructions(dto.linkedEntity),
        model,
        tools: toolDefinitions,
      });

      const orchestration = await runAssistantOrchestration({
        executeTool: (functionCall) =>
          this.assistantToolsService.executeTool(functionCall),
        initialResponse,
        message: dto.message,
        model,
        requestOpenAI: (body) => this.assistantOpenAIClient.request(body),
      });

      const operation =
        dto.operation ??
        detectOperation({
          message: dto.message,
          reportType,
          usedTools: orchestration.usedTools,
        });

      await this.assistantAuditService.logAssistantCall({
        latencyMs: Date.now() - startedAt,
        linkedEntity: orchestration.resolvedEntity,
        model,
        operation,
        promptTokens: orchestration.usage.promptTokens,
        completionTokens: orchestration.usage.completionTokens,
        totalTokens: orchestration.usage.totalTokens,
        estimatedCostUsd: estimateCostUsd({
          completionTokens: orchestration.usage.completionTokens,
          model,
          promptTokens: orchestration.usage.promptTokens,
        }),
        providerRequestId: orchestration.providerRequestId,
        requestInput,
        responseOutput: orchestration.assistantMessage,
        source: dto.source ?? "web",
        status: "success",
        userId: user.id,
        userName,
      });

      return {
        conversationId,
        linkedEntity: orchestration.resolvedEntity,
        message: orchestration.assistantMessage,
        reportType,
        request: {
          message: dto.message,
          model,
        },
        status: "configured",
        usedTools: orchestration.usedTools,
        ...(orchestration.resultView
          ? { resultView: orchestration.resultView }
          : {}),
      };
    } catch (error: unknown) {
      const message = this.normalizeErrorMessage(error);
      await this.assistantAuditService.logAssistantCall({
        errorMessage: message,
        latencyMs: Date.now() - startedAt,
        model,
        operation:
          dto.operation ??
          detectOperation({ message: dto.message, reportType, usedTools: [] }),
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
   * Resolves the OpenAI model to use for the request.
   * Uses the requested model if supported, otherwise falls back to configured model or default.
   *
   * @param requestedModel - The model requested by the client
   * @returns The resolved model identifier
   */
  private resolveModel(requestedModel?: string): string {
    if (requestedModel && supportedModels.has(requestedModel)) {
      return requestedModel;
    }

    const configuredModel = this.configService.get("OPENAI_MODEL", {
      infer: true,
    });
    return supportedModels.has(configuredModel)
      ? configuredModel
      : "gpt-4.1-mini";
  }

  /**
   * Normalizes an error to a user-friendly message.
   * Handles specific error types and provides fallback messages.
   *
   * @param error - The error to normalize
   * @returns A user-friendly error message
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
}
