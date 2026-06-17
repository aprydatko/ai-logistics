import { InternalServerErrorException } from "@nestjs/common";

import type { CreateAssistantMessageDto } from "../dto/create-assistant-message.dto";
import { modelPricing } from "./assistant.constants";
import type {
  AssistantLinkedEntity,
  OpenAIResponseBody,
  OpenAIResponseUsage,
  ToolCall,
} from "./assistant.types";

export const buildOpenAIInput = (
  dto: CreateAssistantMessageDto,
): Array<Record<string, unknown>> => {
  const history = (dto.history ?? []).slice(-6).map((message) => ({
    role: message.role,
    content: [
      {
        type: message.role === "assistant" ? "output_text" : "input_text",
        text: message.text,
      },
    ],
  }));

  const userContent: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text: dto.message,
    },
  ];

  if (dto.attachment) {
    userContent.push(
      dto.attachment.mimeType === "application/pdf"
        ? {
            type: "input_file",
            filename: dto.attachment.name,
            file_data: dto.attachment.fileData,
          }
        : {
            type: "input_image",
            image_url: `data:${dto.attachment.mimeType};base64,${dto.attachment.fileData}`,
            detail: "high",
          },
    );
  }

  return [
    ...history,
    {
      role: "user",
      content: userContent,
    },
  ];
};

export const buildInstructions = (
  linkedEntity?: AssistantLinkedEntity,
): string => {
  const linkedContext = linkedEntity
    ? `\nCurrent linked entity context: ${JSON.stringify(linkedEntity)}`
    : "";

  return [
    "You are a read-only logistics operations assistant.",
    "You help with loads, drivers, incidents, and report generation using the provided tools.",
    "Always use tools for factual claims about records when the question depends on live logistics data.",
    "When the user asks to list, show, find, or compare multiple loads or drivers, prefer the matching search tool instead of answering from memory.",
    "When the user asks for a table, tabular output, rows, columns, or says 'format the result as a table', prefer the matching search tool so the app can render a structured table result.",
    "For driver list requests, prefer search_drivers when the user asks for available drivers, drivers by status, truck, trailer, activity, or a table of drivers.",
    "Never invent ids, statuses, times, or assignments.",
    "Do not perform or imply state-changing actions. If the user asks to reassign, close, update, or mutate data, explain that v1 is read-only and offer guidance only.",
    "For incident questions, explain the current situation first, then recommended next steps when helpful.",
    "For report requests, return a concise structured text report with sections and operational takeaways.",
    "If no records are found, say that clearly and suggest a narrower query.",
    linkedContext,
  ].join("\n");
};

export const extractFunctionCalls = (
  responseBody: OpenAIResponseBody,
): ToolCall[] => {
  if (!Array.isArray(responseBody.output)) {
    return [];
  }

  return responseBody.output.flatMap((item) => {
    if (item.type !== "function_call") {
      return [];
    }

    const name = item.name;
    const argumentsValue = item.arguments;
    const callId = item.call_id;
    if (
      typeof name !== "string" ||
      typeof argumentsValue !== "string" ||
      typeof callId !== "string"
    ) {
      return [];
    }

    return [
      {
        arguments: argumentsValue,
        callId,
        name: name as ToolCall["name"],
      },
    ];
  });
};

export const parseToolArguments = (
  argumentsValue: string,
): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(argumentsValue) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Tool arguments must be an object");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new InternalServerErrorException("Invalid assistant tool arguments");
  }
};

export const getResponseId = (
  responseBody: OpenAIResponseBody,
): string | undefined =>
  typeof responseBody.id === "string" && responseBody.id.trim()
    ? responseBody.id
    : undefined;

export const extractOutputText = (
  responseBody: OpenAIResponseBody,
): string | null => {
  if (
    typeof responseBody.output_text === "string" &&
    responseBody.output_text.trim().length > 0
  ) {
    return responseBody.output_text.trim();
  }

  if (!Array.isArray(responseBody.output)) {
    return null;
  }

  const textParts = responseBody.output.flatMap((item) => {
    if (!Array.isArray(item.content)) {
      return [];
    }

    return item.content.flatMap((contentItem) => {
      if (!contentItem || typeof contentItem !== "object") {
        return [];
      }

      const text = (contentItem as Record<string, unknown>).text;
      return typeof text === "string" && text.trim() ? [text.trim()] : [];
    });
  });

  return textParts.length > 0 ? textParts.join("\n\n") : null;
};

export const getOpenAIUsage = (
  responseBody: OpenAIResponseBody,
): {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
} => {
  const usage = responseBody.usage as OpenAIResponseUsage | undefined;
  return {
    completionTokens:
      typeof usage?.output_tokens === "number" ? usage.output_tokens : 0,
    promptTokens: typeof usage?.input_tokens === "number" ? usage.input_tokens : 0,
    totalTokens: typeof usage?.total_tokens === "number" ? usage.total_tokens : 0,
  };
};

export const estimateCostUsd = ({
  completionTokens,
  model,
  promptTokens,
}: {
  completionTokens: number;
  model: string;
  promptTokens: number;
}): number => {
  const normalizedModel = model.toLowerCase();
  const pricing = Object.entries(modelPricing).find(([key]) =>
    normalizedModel.includes(key),
  );

  if (!pricing) return 0;

  const [, { prompt: promptPrice, completion: completionPrice }] = pricing;
  return Number(
    (
      (promptTokens / 1_000_000) * promptPrice +
      (completionTokens / 1_000_000) * completionPrice
    ).toFixed(6),
  );
};

export const buildRequestInputLog = (
  dto: CreateAssistantMessageDto,
): string => {
  const historyLog = (dto.history ?? [])
    .slice(-4)
    .map((message) => `${message.role}: ${message.text}`)
    .join("\n");
  const attachmentLog = dto.attachment
    ? `\n[Attachment: ${dto.attachment.name} (${dto.attachment.mimeType})]`
    : "";
  const linkedEntityLog = dto.linkedEntity
    ? `\n[Linked entity: ${dto.linkedEntity.type} ${dto.linkedEntity.recordId}]`
    : "";

  return [historyLog, `user: ${dto.message}${attachmentLog}${linkedEntityLog}`]
    .filter(Boolean)
    .join("\n");
};
