import type { AssistantRequestDto, AssistantResponseDto } from "@repo/shared";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
} from "@/lib/auth/server-session";
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
      type: z.enum(["load", "driver", "incident"]),
      recordId: z.string().trim().min(1).max(120),
      title: z.string().trim().min(1).max(200),
      route: z.string().trim().min(1).max(255).optional(),
    })
    .optional(),
  operation: z.string().trim().min(1).max(160).optional(),
  source: z.enum(["web", "mobile", "api"]).optional(),
  conversationId: z.string().trim().min(1).max(120).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().trim().min(1).max(4000),
      }),
    )
    .max(8)
    .optional(),
});

type AssistantAttachment = NonNullable<AssistantRequestDto["attachment"]>;
type AssistantRequest = z.infer<typeof assistantRequestSchema>;

const buildPlaceholderResponse = (
  request: AssistantRequest,
  configuredModel: string,
): AssistantResponseDto => ({
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

const isRequestFile = (value: FormDataEntryValue | null): value is File =>
  value instanceof File;

const isJsonRequest = (request: Request): boolean =>
  request.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("application/json") ?? false;

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

const parseMultipartRequest = async (
  request: Request,
): Promise<{
  attachment: AssistantAttachment | null;
  request: AssistantRequest;
}> => {
  const formData = await request.formData();
  const historyValue = formData.get("history");
  const linkedEntityValue = formData.get("linkedEntity");

  const parsedRequest = assistantRequestSchema.safeParse({
    message: formData.get("message"),
    model: formData.get("model") || undefined,
    operation: formData.get("operation") || undefined,
    source: formData.get("source") || undefined,
    conversationId: formData.get("conversationId") || undefined,
    history:
      typeof historyValue === "string" && historyValue.trim()
        ? JSON.parse(historyValue)
        : undefined,
    linkedEntity:
      typeof linkedEntityValue === "string" && linkedEntityValue.trim()
        ? JSON.parse(linkedEntityValue)
        : undefined,
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
      mimeType: file.type as AssistantAttachment["mimeType"],
      name: file.name,
    },
    request: parsedRequest.data,
  };
};

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

const forwardAssistantRequest = async ({
  accessToken,
  payload,
}: {
  accessToken: string;
  payload: AssistantRequestDto;
}): Promise<Response> =>
  fetch(`${API_BASE_URL}/assistant`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

export const GET = async (): Promise<NextResponse> =>
  NextResponse.json(buildStatusResponse(), { status: 200 });

export const POST = async (request: Request): Promise<NextResponse> => {
  let parsedRequest: AssistantRequest;
  let attachment: AssistantAttachment | null = null;

  try {
    const parsed = await parseAssistantRequest(request);
    parsedRequest = parsed.request;
    attachment = parsed.attachment;
  } catch (error) {
    if (error instanceof Error && error.message === "UNSUPPORTED_ATTACHMENT_TYPE") {
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
  if (!config.isConfigured) {
    return NextResponse.json(
      buildPlaceholderResponse(parsedRequest, config.model),
      { status: 503 },
    );
  }

  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;
    let refreshedSession: Awaited<ReturnType<typeof refreshSession>> = null;

    if (!accessToken && refreshToken) {
      refreshedSession = await refreshSession(refreshToken);
      accessToken = refreshedSession?.accessToken;
    }

    if (!accessToken) {
      const response = NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
      if (refreshToken) {
        clearSessionCookies(response);
      }
      return response;
    }

    const payload: AssistantRequestDto = {
      ...parsedRequest,
      attachment,
      source: parsedRequest.source ?? "web",
    };

    let apiResponse = await forwardAssistantRequest({ accessToken, payload });

    if (apiResponse.status === 401 && refreshToken && !refreshedSession) {
      refreshedSession = await refreshSession(refreshToken);
      if (refreshedSession) {
        apiResponse = await forwardAssistantRequest({
          accessToken: refreshedSession.accessToken,
          payload,
        });
      }
    }

    const responseBody: unknown = await apiResponse.json().catch(() => ({
      message: "Assistant service unavailable",
    }));
    const response = NextResponse.json(responseBody, {
      status: apiResponse.status,
    });

    if (refreshedSession) {
      setSessionCookies(response, refreshedSession);
    } else if (apiResponse.status === 401 && refreshToken) {
      clearSessionCookies(response);
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "Assistant service unavailable" },
      { status: 503 },
    );
  }
};
