import type { CreateAiLogDto } from "@repo/shared";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { refreshSession } from "@/lib/auth/server-session";
import { getAssistantOpenAIConfig } from "@/lib/assistant/openai-config";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";
const supportedAttachmentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
const maxAttachmentSizeBytes = 5 * 1024 * 1024;

const assistantRequestSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
  model: z.string().trim().min(1).optional(),
  linkedEntity: z
    .object({
      type: z.string().trim().min(1).max(80),
      recordId: z.string().trim().min(1).max(120),
      title: z.string().trim().min(1).max(200),
      route: z.string().trim().min(1).max(255).optional(),
    })
    .optional(),
  operation: z.string().trim().min(1).max(160).optional(),
  source: z.enum(["web", "mobile", "api"]).optional(),
});

type AssistantRequest = z.infer<typeof assistantRequestSchema>;

type AssistantAttachment = {
  fileData: string;
  mimeType: (typeof supportedAttachmentMimeTypes)[number];
  name: string;
};

/**
 * Builds a placeholder response when OpenAI is not configured.
 *
 * @param request - The assistant request data
 * @param configuredModel - The configured OpenAI model name
 * @returns A placeholder response object with status and configuration info
 */
const buildPlaceholderResponse = (
  request: AssistantRequest,
  configuredModel: string,
): Record<string, unknown> => ({
  status: "placeholder",
  message:
    "Assistant OpenAI setup is ready. Add OPENAI_API_KEY to apps/web/.env.local to enable real responses.",
  request: {
    message: request.message,
    model: request.model ?? configuredModel,
  },
});

/**
 * Builds a status response indicating OpenAI configuration state.
 *
 * @returns A status response object with configuration status and model info
 */
const buildStatusResponse = (): Record<string, unknown> => {
  const config = getAssistantOpenAIConfig();

  if (!config.isConfigured) {
    return {
      status: "placeholder",
      message:
        "OpenAI setup is not connected yet. Add OPENAI_API_KEY to apps/web/.env.local.",
      model: config.model,
    };
  }

  return {
    status: "configured",
    message: "OpenAI setup is connected and ready for chat requests.",
    model: config.model,
  };
};

/**
 * Type guard to check if a FormData entry value is a File.
 *
 * @param value - The FormData entry value to check
 * @returns True if the value is a File instance
 */
const isRequestFile = (value: FormDataEntryValue | null): value is File =>
  value instanceof File;

/**
 * Checks if the request has a JSON content type.
 *
 * @param request - The incoming request object
 * @returns True if the request content type is JSON
 */
const isJsonRequest = (request: Request): boolean =>
  request.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("application/json") ?? false;

/**
 * Parses a JSON request body and validates it against the assistant request schema.
 *
 * @param request - The incoming request with JSON body
 * @returns Parsed request data with null attachment
 * @throws Error if the request is invalid
 */
const parseJsonRequest = async (
  request: Request,
): Promise<{
  attachment: AssistantAttachment | null;
  request: AssistantRequest;
}> => {
  const body: unknown = await request.json();
  const parsedRequest = assistantRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    throw new Error("INVALID_REQUEST");
  }

  return {
    attachment: null,
    request: parsedRequest.data,
  };
};

/**
 * Parses a multipart/form-data request with optional file attachment.
 *
 * Validates the request schema and checks attachment type and size.
 * Supports PDF, JPEG, PNG, and WEBP files up to 5MB.
 *
 * @param request - The incoming request with multipart form data
 * @returns Parsed request data with optional attachment
 * @throws Error if the request is invalid, attachment type is unsupported, or file is too large
 */
const parseMultipartRequest = async (
  request: Request,
): Promise<{
  attachment: AssistantAttachment | null;
  request: AssistantRequest;
}> => {
  const formData = await request.formData();
  const parsedRequest = assistantRequestSchema.safeParse({
    message: formData.get("message"),
    model: formData.get("model") || undefined,
    operation: formData.get("operation") || undefined,
    source: formData.get("source") || undefined,
  });

  if (!parsedRequest.success) {
    throw new Error("INVALID_REQUEST");
  }

  const file = formData.get("file");
  if (!isRequestFile(file)) {
    return {
      attachment: null,
      request: parsedRequest.data,
    };
  }

  if (
    !supportedAttachmentMimeTypes.includes(
      file.type as (typeof supportedAttachmentMimeTypes)[number],
    )
  ) {
    throw new Error("UNSUPPORTED_ATTACHMENT_TYPE");
  }

  if (file.size > maxAttachmentSizeBytes) {
    throw new Error("ATTACHMENT_TOO_LARGE");
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  return {
    attachment: {
      fileData: bytes.toString("base64"),
      mimeType: file.type as (typeof supportedAttachmentMimeTypes)[number],
      name: file.name,
    },
    request: parsedRequest.data,
  };
};

/**
 * Parses an assistant request, detecting whether it's JSON or multipart/form-data.
 *
 * @param request - The incoming request
 * @returns Parsed request data with optional attachment
 */
const parseAssistantRequest = async (
  request: Request,
): Promise<{
  attachment: AssistantAttachment | null;
  request: AssistantRequest;
}> => {
  if (isJsonRequest(request)) {
    return parseJsonRequest(request);
  }

  return parseMultipartRequest(request);
};

/**
 * Builds the input payload for the OpenAI API request.
 *
 * Formats the message and attachment according to OpenAI's API requirements.
 * Handles both text-only and text-with-attachment scenarios.
 *
 * @param request - The assistant request data
 * @param attachment - Optional file attachment data
 * @returns Formatted input for OpenAI API (string or array of message parts)
 */
const buildOpenAIInput = (
  request: AssistantRequest,
  attachment: AssistantAttachment | null,
): Array<Record<string, unknown>> | string => {
  if (!attachment) {
    return request.message;
  }

  const attachmentPart =
    attachment.mimeType === "application/pdf"
      ? {
          type: "input_file",
          filename: attachment.name,
          file_data: attachment.fileData,
          detail: "high",
        }
      : {
          type: "input_image",
          image_url: `data:${attachment.mimeType};base64,${attachment.fileData}`,
          detail: "high",
        };

  return [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: request.message,
        },
        attachmentPart,
      ],
    },
  ];
};

/**
 * Builds a log-friendly string representation of the request input.
 *
 * @param request - The assistant request data
 * @param attachment - Optional file attachment data
 * @returns A string representation of the request for logging
 */
const buildRequestInputLog = (
  request: AssistantRequest,
  attachment: AssistantAttachment | null,
): string =>
  attachment
    ? `${request.message}\n\n[Attachment: ${attachment.name} (${attachment.mimeType})]`
    : request.message;

/**
 * Extracts the error message from an OpenAI API error response.
 *
 * @param responseBody - The parsed response body from OpenAI
 * @returns The error message string or null if not found
 */
const getOpenAIErrorMessage = (responseBody: unknown): string | null => {
  if (!responseBody || typeof responseBody !== "object") return null;
  const responseRecord = responseBody as Record<string, unknown>;

  const error = responseRecord.error;
  if (!error || typeof error !== "object") return null;

  const errorRecord = error as Record<string, unknown>;
  const message = errorRecord.message;
  return typeof message === "string" && message.trim() ? message : null;
};

/**
 * Extracts token usage information from an OpenAI API response.
 *
 * @param responseBody - The parsed response body from OpenAI
 * @returns Token usage counts (completion, prompt, total)
 */
const getOpenAIUsage = (
  responseBody: unknown,
): {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
} => {
  if (!responseBody || typeof responseBody !== "object") {
    return {
      completionTokens: 0,
      promptTokens: 0,
      totalTokens: 0,
    };
  }

  const usage = (responseBody as Record<string, unknown>).usage;
  if (!usage || typeof usage !== "object") {
    return {
      completionTokens: 0,
      promptTokens: 0,
      totalTokens: 0,
    };
  }

  const usageRecord = usage as Record<string, unknown>;
  const toNumber = (value: unknown): number =>
    typeof value === "number" && Number.isFinite(value) ? value : 0;

  return {
    completionTokens: toNumber(usageRecord.output_tokens),
    promptTokens: toNumber(usageRecord.input_tokens),
    totalTokens: toNumber(usageRecord.total_tokens),
  };
};

/**
 * Extracts the output text from an OpenAI API response.
 *
 * Handles both direct output_text field and nested output array structure.
 *
 * @param responseBody - The parsed response body from OpenAI
 * @returns The extracted output text or null if not found
 */
const extractOutputText = (responseBody: unknown): string | null => {
  if (!responseBody || typeof responseBody !== "object") return null;
  const responseRecord = responseBody as Record<string, unknown>;

  const directOutputText = responseRecord.output_text;
  if (
    typeof directOutputText === "string" &&
    directOutputText.trim().length > 0
  ) {
    return directOutputText.trim();
  }

  const output = responseRecord.output;
  if (!Array.isArray(output)) return null;

  const textParts = output.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const itemRecord = item as Record<string, unknown>;

    const content = itemRecord.content;
    if (!Array.isArray(content)) return [];

    return content.flatMap((contentItem) => {
      if (!contentItem || typeof contentItem !== "object") return [];
      const contentRecord = contentItem as Record<string, unknown>;

      const text = contentRecord.text;
      return typeof text === "string" && text.trim().length > 0
        ? [text.trim()]
        : [];
    });
  });

  return textParts.length > 0 ? textParts.join("\n\n") : null;
};

/**
 * Extracts the response ID from an OpenAI API response.
 *
 * @param responseBody - The parsed response body from OpenAI
 * @returns The response ID string or undefined if not found
 */
const getResponseId = (responseBody: unknown): string | undefined => {
  if (!responseBody || typeof responseBody !== "object") return undefined;
  const responseId = (responseBody as Record<string, unknown>).id;
  return typeof responseId === "string" && responseId.trim()
    ? responseId
    : undefined;
};

/**
 * Estimates the cost in USD for an OpenAI API request based on token usage.
 *
 * Supports GPT-4.1-mini and GPT-4.1 models with their respective pricing.
 *
 * @param completionTokens - Number of completion tokens used
 * @param model - The OpenAI model name
 * @param promptTokens - Number of prompt tokens used
 * @returns Estimated cost in USD
 */
const estimateCostUsd = ({
  completionTokens,
  model,
  promptTokens,
}: {
  completionTokens: number;
  model: string;
  promptTokens: number;
}): number => {
  const normalizedModel = model.toLowerCase();

  if (normalizedModel.includes("gpt-4.1-mini")) {
    return Number(
      (
        (promptTokens / 1_000_000) * 0.4 +
        (completionTokens / 1_000_000) * 1.6
      ).toFixed(6),
    );
  }

  if (normalizedModel.includes("gpt-4.1")) {
    return Number(
      (
        (promptTokens / 1_000_000) * 2 +
        (completionTokens / 1_000_000) * 8
      ).toFixed(6),
    );
  }

  return 0;
};

/**
 * Creates an AI log entry in the backend API.
 *
 * Logs assistant requests, responses, and metadata for tracking and analysis.
 * Handles authentication and token refresh automatically.
 * Errors are silently caught to prevent breaking assistant responses.
 *
 * @param payload - The AI log data to create
 */
const createAiLog = async (payload: CreateAiLogDto): Promise<void> => {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;
    let refreshedSession: Awaited<ReturnType<typeof refreshSession>> = null;

    if (!accessToken && refreshToken) {
      refreshedSession = await refreshSession(refreshToken);
      accessToken = refreshedSession?.accessToken;
    }

    if (!accessToken) return;

    await fetch(`${API_BASE_URL}/ai-logs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    // Logging should not break assistant responses.
  }
};

/**
 * Retrieves the current session user information.
 *
 * Uses the refresh token to get user details from the session.
 * Returns a default "Unknown user" if no session exists.
 *
 * @returns User information with optional ID and name
 */
const getSessionUser = async (): Promise<{
  id?: string;
  name: string;
}> => {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (!refreshToken) {
      return { name: "Unknown user" };
    }

    const refreshedSession = await refreshSession(refreshToken);
    if (!refreshedSession) {
      return { name: "Unknown user" };
    }

    return {
      id: refreshedSession.user.id,
      name: `${refreshedSession.user.firstName} ${refreshedSession.user.lastName}`.trim(),
    };
  } catch {
    return { name: "Unknown user" };
  }
};

/**
 * Handles GET requests to check the OpenAI assistant configuration status.
 *
 * Returns information about whether OpenAI is configured and ready for use.
 *
 * @returns A NextResponse with the configuration status
 */
export const GET = async (): Promise<NextResponse> =>
  NextResponse.json(buildStatusResponse(), { status: 200 });

/**
 * Handles POST requests to send a message to the AI assistant.
 *
 * Processes the assistant request, sends it to OpenAI if configured,
 * and logs the interaction. Supports both JSON and multipart/form-data
 * requests with optional file attachments.
 *
 * @param request - The incoming request with message and optional attachment
 * @returns A NextResponse with the assistant's response or error
 */
export const POST = async (request: Request): Promise<NextResponse> => {
  const startedAt = Date.now();
  try {
    let parsedRequest: AssistantRequest;
    let attachment: AssistantAttachment | null = null;
    try {
      const parsed = await parseAssistantRequest(request);
      parsedRequest = parsed.request;
      attachment = parsed.attachment;
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_REQUEST") {
        return NextResponse.json(
          { message: "Invalid assistant request" },
          { status: 400 },
        );
      }
      if (
        error instanceof Error &&
        error.message === "UNSUPPORTED_ATTACHMENT_TYPE"
      ) {
        return NextResponse.json(
          {
            message: "Only PDF, JPEG, PNG, and WEBP attachments are supported.",
          },
          { status: 400 },
        );
      }
      if (error instanceof Error && error.message === "ATTACHMENT_TOO_LARGE") {
        return NextResponse.json(
          { message: "Attachment must be 5 MB or smaller." },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { message: "Invalid assistant request" },
        { status: 400 },
      );
    }

    const config = getAssistantOpenAIConfig();
    const requestedModel = parsedRequest.model ?? config.model;
    const user = await getSessionUser();
    const requestInput = buildRequestInputLog(parsedRequest, attachment);

    if (!config.isConfigured) {
      await createAiLog({
        operation: parsedRequest.operation ?? "AI Assistant (chat)",
        model: requestedModel,
        status: "failed",
        latencyMs: Date.now() - startedAt,
        errorMessage: "OpenAI API key is not configured",
        requestInput,
        source: parsedRequest.source ?? "web",
        userId: user.id,
        userName: user.name,
        linkedEntity: parsedRequest.linkedEntity,
      });
      return NextResponse.json(
        buildPlaceholderResponse(parsedRequest, config.model),
        { status: 503 },
      );
    }

    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: buildOpenAIInput(parsedRequest, attachment),
        model: requestedModel,
      }),
      cache: "no-store",
    });
    const responseBody: unknown = await openAIResponse.json().catch(() => null);
    const usage = getOpenAIUsage(responseBody);
    const latencyMs = Date.now() - startedAt;

    if (!openAIResponse.ok) {
      await createAiLog({
        operation: parsedRequest.operation ?? "AI Assistant (chat)",
        model: requestedModel,
        status: "failed",
        latencyMs,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estimatedCostUsd: estimateCostUsd({
          completionTokens: usage.completionTokens,
          model: requestedModel,
          promptTokens: usage.promptTokens,
        }),
        userId: user.id,
        userName: user.name,
        source: parsedRequest.source ?? "web",
        providerRequestId: getResponseId(responseBody),
        requestInput,
        errorMessage:
          getOpenAIErrorMessage(responseBody) || "OpenAI request failed.",
        linkedEntity: parsedRequest.linkedEntity,
      });
      return NextResponse.json(
        {
          message:
            getOpenAIErrorMessage(responseBody) || "OpenAI request failed.",
          request: {
            message: parsedRequest.message,
            model: requestedModel,
          },
          status: "error",
        },
        { status: openAIResponse.status || 502 },
      );
    }

    const assistantResponse = extractOutputText(responseBody);

    if (!assistantResponse) {
      await createAiLog({
        operation: parsedRequest.operation ?? "AI Assistant (chat)",
        model: requestedModel,
        status: "failed",
        latencyMs,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estimatedCostUsd: estimateCostUsd({
          completionTokens: usage.completionTokens,
          model: requestedModel,
          promptTokens: usage.promptTokens,
        }),
        userId: user.id,
        userName: user.name,
        source: parsedRequest.source ?? "web",
        providerRequestId: getResponseId(responseBody),
        requestInput,
        errorMessage: "OpenAI returned an empty response",
        linkedEntity: parsedRequest.linkedEntity,
      });
      return NextResponse.json(
        { message: "OpenAI returned an empty response" },
        { status: 502 },
      );
    }

    await createAiLog({
      operation: parsedRequest.operation ?? "AI Assistant (chat)",
      model: requestedModel,
      status: "success",
      latencyMs,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      estimatedCostUsd: estimateCostUsd({
        completionTokens: usage.completionTokens,
        model: requestedModel,
        promptTokens: usage.promptTokens,
      }),
      userId: user.id,
      userName: user.name,
      source: parsedRequest.source ?? "web",
      providerRequestId: getResponseId(responseBody),
      requestInput,
      responseOutput: assistantResponse,
      linkedEntity: parsedRequest.linkedEntity,
    });

    return NextResponse.json(
      {
        status: "configured",
        message: assistantResponse,
        request: {
          message: parsedRequest.message,
          model: requestedModel,
        },
      },
      { status: 200 },
    );
  } catch {
    const user = await getSessionUser();
    await createAiLog({
      operation: "AI Assistant (chat)",
      model: getAssistantOpenAIConfig().model,
      status: "failed",
      latencyMs: Date.now() - startedAt,
      errorMessage: "Assistant service unavailable",
      requestInput: "Unknown request",
      source: "web",
      userId: user.id,
      userName: user.name,
    });
    return NextResponse.json(
      { message: "Assistant service unavailable" },
      { status: 503 },
    );
  }
};
