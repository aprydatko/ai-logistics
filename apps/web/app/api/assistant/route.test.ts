import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCookies = vi.fn();
const mockRefreshSession = vi.fn();
const mockSetSessionCookies = vi.fn();
const mockClearSessionCookies = vi.fn();

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@/lib/auth/server-session", () => ({
  clearSessionCookies: mockClearSessionCookies,
  refreshSession: mockRefreshSession,
  setSessionCookies: mockSetSessionCookies,
}));

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
  if (model) {
    formData.append("model", model);
  }
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

describe("assistant route", () => {
  beforeEach(() => {
    mockCookies.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === "access_token") {
          return { value: "access-token" };
        }
        return undefined;
      }),
    });
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    vi.restoreAllMocks();
    mockCookies.mockReset();
    mockRefreshSession.mockReset();
    mockSetSessionCookies.mockReset();
    mockClearSessionCookies.mockReset();
  });

  it("returns 400 for an invalid assistant request", async () => {
    process.env.OPENAI_API_KEY = "test-key";
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

  it("proxies assistant responses from the backend service", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-4.1-mini";
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        status: "configured",
        message: "Found 2 delayed loads in Texas.",
        usedTools: ["search_loads"],
        linkedEntity: {
          type: "load",
          recordId: "load-1",
          title: "LD-1001",
          route: "/loads/load-1",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const response = await POST(
      createJsonRequest({
        message: "show delayed loads in Texas",
        history: [{ role: "assistant", text: "Previous reply" }],
        linkedEntity: {
          type: "load",
          recordId: "load-1",
          title: "LD-1001",
          route: "/loads/load-1",
        },
      }),
    );

    await expect(response.json()).resolves.toEqual({
      status: "configured",
      message: "Found 2 delayed loads in Texas.",
      usedTools: ["search_loads"],
      linkedEntity: {
        type: "load",
        recordId: "load-1",
        title: "LD-1001",
        route: "/loads/load-1",
      },
    });
    expect(response.status).toBe(200);
    const proxyCall = fetchMock.mock.calls[0];
    expect(proxyCall?.[0]).toBe("http://localhost:3001/api/assistant");
    expect(proxyCall?.[1]).toMatchObject({
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: "Bearer access-token",
        "Content-Type": "application/json",
      },
    });
    expect(JSON.parse(String(proxyCall?.[1]?.body))).toEqual({
      message: "show delayed loads in Texas",
      history: [{ role: "assistant", text: "Previous reply" }],
      linkedEntity: {
        type: "load",
        recordId: "load-1",
        title: "LD-1001",
        route: "/loads/load-1",
      },
      source: "web",
      attachment: null,
    });
  });

  it("encodes supported attachments before proxying", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        status: "configured",
        message: "I reviewed the proof of delivery.",
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
      message: "I reviewed the proof of delivery.",
    });

    const proxyCall = fetchMock.mock.calls[0];
    expect(proxyCall).toBeDefined();
    if (!proxyCall) {
      throw new Error("Expected proxy fetch call");
    }
    expect(JSON.parse(proxyCall[1].body as string)).toEqual(
      expect.objectContaining({
        message: "Check this proof of delivery",
        model: "gpt-4.1-mini",
        source: "web",
        attachment: expect.objectContaining({
          mimeType: "image/png",
          name: "pod.png",
        }),
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
});
