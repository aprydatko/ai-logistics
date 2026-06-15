import { NextResponse } from "next/server";
import { z } from "zod";

import { getAssistantOpenAIConfig } from "@/lib/assistant/openai-config";

const assistantRequestSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
  model: z.string().trim().min(1).optional(),
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

export const GET = async (): Promise<NextResponse> =>
  NextResponse.json(buildStatusResponse(), { status: 200 });

export const POST = async (request: Request): Promise<NextResponse> => {
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

    if (!config.isConfigured) {
      return NextResponse.json(
        buildPlaceholderResponse(parsedRequest.data, config.model),
        { status: 503 },
      );
    }

    const requestedModel = parsedRequest.data.model ?? config.model;
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

    if (!openAIResponse.ok) {
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
      return NextResponse.json(
        { message: "OpenAI returned an empty response" },
        { status: 502 },
      );
    }

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
    return NextResponse.json(
      { message: "Assistant service unavailable" },
      { status: 503 },
    );
  }
};
