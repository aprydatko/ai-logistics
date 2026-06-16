import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const createJsonRequest = (body: unknown): Request =>
  new Request("https://app.example.com/api/assistant", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

const createMultipartRequest = ({
  file,
  message,
  model,
}: {
  file: File;
  message: string;
  model?: string;
}): Request => {
  const formData = new FormData();
  formData.append("message", message);
  if (model) formData.append("model", model);
  formData.append("file", file);

  const request = new Request("https://app.example.com/api/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data; boundary=test-boundary",
    },
  });

  Object.defineProperty(request, "formData", {
    value: async () => formData,
  });

  return request;
};

describe("POST /api/assistant", () => {
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    vi.restoreAllMocks();
  });

  it("returns 400 for an invalid assistant request", async () => {
    const { POST } = await import("./route");

    const response = await POST(createJsonRequest({ message: "" }));

    await expect(response.json()).resolves.toEqual({
      message: "Invalid assistant request",
    });
    expect(response.status).toBe(400);
  });

  it("returns a placeholder response when OPENAI_API_KEY is missing", async () => {
    process.env.OPENAI_MODEL = "gpt-4.1-mini";
    const { POST } = await import("./route");

    const response = await POST(
      createJsonRequest({ message: "Summarize delayed loads" }),
    );

    await expect(response.json()).resolves.toEqual({
      status: "placeholder",
      message:
        "Assistant OpenAI setup is ready. Add OPENAI_API_KEY to apps/web/.env.local to enable real responses.",
      request: {
        message: "Summarize delayed loads",
        model: "gpt-4.1-mini",
      },
    });
    expect(response.status).toBe(503);
  });

  it("returns placeholder status from GET when OPENAI_API_KEY is missing", async () => {
    process.env.OPENAI_MODEL = "gpt-4.1-mini";

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      status: "placeholder",
      message:
        "OpenAI setup is not connected yet. Add OPENAI_API_KEY to apps/web/.env.local.",
      model: "gpt-4.1-mini",
    });
    expect(response.status).toBe(200);
  });

  it("returns configured status from GET when OPENAI_API_KEY exists", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-4.1-mini";

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      status: "configured",
      message: "OpenAI setup is connected and ready for chat requests.",
      model: "gpt-4.1-mini",
    });
    expect(response.status).toBe(200);
  });

  it("returns an assistant response when OPENAI_API_KEY is present", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-4.1";
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "Here is a live assistant response.",
              },
            ],
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const response = await POST(
      createJsonRequest({
        message: "Summarize delayed loads",
        model: "o3",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      status: "configured",
      message: "Here is a live assistant response.",
      request: {
        message: "Summarize delayed loads",
        model: "o3",
      },
    });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("sends image attachments to OpenAI in multipart assistant requests", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        output_text: "I analyzed the image attachment.",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const response = await POST(
      createMultipartRequest({
        message: "Check this proof of delivery",
        model: "gpt-4.1-mini",
        file: new File(["fake-image"], "pod.png", { type: "image/png" }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      status: "configured",
      message: "I analyzed the image attachment.",
      request: {
        message: "Check this proof of delivery",
        model: "gpt-4.1-mini",
      },
    });

    const openAICall = fetchMock.mock.calls.find(
      ([url]) => url === "https://api.openai.com/v1/responses",
    );
    expect(openAICall).toBeDefined();
    expect(JSON.parse(openAICall![1].body as string)).toEqual(
      expect.objectContaining({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Check this proof of delivery",
              },
              expect.objectContaining({
                type: "input_image",
                detail: "high",
              }),
            ],
          },
        ],
      }),
    );
  });

  it("rejects unsupported assistant attachment types", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const { POST } = await import("./route");

    const response = await POST(
      createMultipartRequest({
        message: "Analyze this spreadsheet",
        file: new File(["a,b,c"], "sheet.csv", { type: "text/csv" }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      message: "Only PDF, JPEG, PNG, and WEBP attachments are supported.",
    });
    expect(response.status).toBe(400);
  });

  it("returns the OpenAI error message when the upstream request fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        {
          error: {
            message: "The model `o3` is not available for this project.",
          },
        },
        { status: 400 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const response = await POST(
      createJsonRequest({
        message: "Summarize delayed loads",
        model: "o3",
      }),
    );

    await expect(response.json()).resolves.toEqual({
      message: "The model `o3` is not available for this project.",
      request: {
        message: "Summarize delayed loads",
        model: "o3",
      },
      status: "error",
    });
    expect(response.status).toBe(400);
  });
});
