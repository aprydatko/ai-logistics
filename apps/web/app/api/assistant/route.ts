import type { CreateAiLogDto } from "@repo/shared";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { refreshSession } from "@/lib/auth/server-session";
import { getAssistantOpenAIConfig } from "@/lib/assistant/openai-config";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api";

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

const getOpenAIErrorMessage = (responseBody: unknown): string | null => {
  if (!responseBody || typeof responseBody !== "object") return null;
  const responseRecord = responseBody as Record<string, unknown>;

  const error = responseRecord.error;
  if (!error || typeof error !== "object") return null;

  const errorRecord = error as Record<string, unknown>;
  const message = errorRecord.message;
  return typeof message === "string" && message.trim() ? message : null;
};

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

const getResponseId = (responseBody: unknown): string | undefined => {
  if (!responseBody || typeof responseBody !== "object") return undefined;
  const responseId = (responseBody as Record<string, unknown>).id;
  return typeof responseId === "string" && responseId.trim()
    ? responseId
    : undefined;
};

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

export const GET = async (): Promise<NextResponse> =>
  NextResponse.json(buildStatusResponse(), { status: 200 });

export const POST = async (request: Request): Promise<NextResponse> => {
  const startedAt = Date.now();
  try {
    const body: unknown = await request.json();
    const parsedRequest = assistantRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return NextResponse.json(
        { message: "Invalid assistant request" },
        { status: 400 },
      );
    }

    const config = getAssistantOpenAIConfig();
    const requestedModel = parsedRequest.data.model ?? config.model;
    const user = await getSessionUser();

    if (!config.isConfigured) {
      await createAiLog({
        operation: parsedRequest.data.operation ?? "AI Assistant (chat)",
        model: requestedModel,
        status: "failed",
        latencyMs: Date.now() - startedAt,
        errorMessage: "OpenAI API key is not configured",
        requestInput: parsedRequest.data.message,
        source: parsedRequest.data.source ?? "web",
        userId: user.id,
        userName: user.name,
        linkedEntity: parsedRequest.data.linkedEntity,
      });
      return NextResponse.json(
        buildPlaceholderResponse(parsedRequest.data, config.model),
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
        input: parsedRequest.data.message,
        model: requestedModel,
      }),
      cache: "no-store",
    });
    const responseBody: unknown = await openAIResponse.json().catch(() => null);
    const usage = getOpenAIUsage(responseBody);
    const latencyMs = Date.now() - startedAt;

    if (!openAIResponse.ok) {
      await createAiLog({
        operation: parsedRequest.data.operation ?? "AI Assistant (chat)",
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
        source: parsedRequest.data.source ?? "web",
        providerRequestId: getResponseId(responseBody),
        requestInput: parsedRequest.data.message,
        errorMessage:
          getOpenAIErrorMessage(responseBody) || "OpenAI request failed.",
        linkedEntity: parsedRequest.data.linkedEntity,
      });
      return NextResponse.json(
        {
          message:
            getOpenAIErrorMessage(responseBody) || "OpenAI request failed.",
          request: {
            message: parsedRequest.data.message,
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
        operation: parsedRequest.data.operation ?? "AI Assistant (chat)",
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
        source: parsedRequest.data.source ?? "web",
        providerRequestId: getResponseId(responseBody),
        requestInput: parsedRequest.data.message,
        errorMessage: "OpenAI returned an empty response",
        linkedEntity: parsedRequest.data.linkedEntity,
      });
      return NextResponse.json(
        { message: "OpenAI returned an empty response" },
        { status: 502 },
      );
    }

    await createAiLog({
      operation: parsedRequest.data.operation ?? "AI Assistant (chat)",
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
      source: parsedRequest.data.source ?? "web",
      providerRequestId: getResponseId(responseBody),
      requestInput: parsedRequest.data.message,
      responseOutput: assistantResponse,
      linkedEntity: parsedRequest.data.linkedEntity,
    });

    return NextResponse.json(
      {
        status: "configured",
        message: assistantResponse,
        request: {
          message: parsedRequest.data.message,
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
