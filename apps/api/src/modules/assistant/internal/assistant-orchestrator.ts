import { buildDriversTableResult } from "./assistant-driver-results";
import { InternalServerErrorException } from "@nestjs/common";

import { buildLoadsTableResult } from "./assistant-load-results";
import {
  extractFunctionCalls,
  extractOutputText,
  getOpenAIUsage,
  getResponseId,
} from "./assistant-openai";
import type {
  AssistantLinkedEntity,
  AssistantResultPayload,
  AssistantToolName,
  OpenAIResponseBody,
  ToolCall,
} from "./assistant.types";

export type AssistantOrchestrationResult = {
  assistantMessage: string;
  providerRequestId?: string;
  resolvedEntity?: AssistantLinkedEntity;
  resultView?: AssistantResultPayload;
  usage: {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
  };
  usedTools: AssistantToolName[];
};

export const runAssistantOrchestration = async ({
  executeTool,
  initialResponse,
  message,
  model,
  requestOpenAI,
}: {
  executeTool: (functionCall: ToolCall) => Promise<{
    linkedEntity?: AssistantLinkedEntity;
    output: Record<string, unknown>;
  }>;
  initialResponse: OpenAIResponseBody;
  message: string;
  model: string;
  requestOpenAI: (body: Record<string, unknown>) => Promise<OpenAIResponseBody>;
}): Promise<AssistantOrchestrationResult> => {
  const usedTools = new Set<AssistantToolName>();
  let resolvedEntity: AssistantLinkedEntity | undefined;
  let resultView: AssistantResultPayload | undefined;
  let responseBody = initialResponse;
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
      const result = await executeTool(functionCall);
      usedTools.add(functionCall.name);
      if (result.linkedEntity) {
        resolvedEntity = result.linkedEntity;
      }
      if (functionCall.name === "search_loads") {
        resultView = buildLoadsTableResult({
          message,
          output: result.output,
        });
      }
      if (functionCall.name === "search_drivers") {
        resultView = buildDriversTableResult({
          message,
          output: result.output,
        });
      }
      toolOutputs.push({
        type: "function_call_output",
        call_id: functionCall.callId,
        output: JSON.stringify(result.output),
      });
    }

    responseBody = await requestOpenAI({
      input: toolOutputs,
      model,
      previous_response_id: responseId,
    });
    responseId = getResponseId(responseBody);
  }

  const assistantMessage = extractOutputText(responseBody);
  if (!assistantMessage) {
    throw new InternalServerErrorException("OpenAI returned an empty response");
  }

  return {
    assistantMessage,
    providerRequestId: responseId,
    resolvedEntity,
    resultView,
    usage: getOpenAIUsage(responseBody),
    usedTools: [...usedTools],
  };
};
