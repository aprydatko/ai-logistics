import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AssistantOpenAIClient } from "./assistant-openai-client";

const createClient = (): AssistantOpenAIClient =>
  new AssistantOpenAIClient({
    get: vi.fn((key: string) => {
      if (key === "OPENAI_API_KEY") {
        return "test-key";
      }

      return undefined;
    }),
  } as never);

describe("AssistantOpenAIClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("retries once after a 429 response and then succeeds", async () => {
    const client = createClient();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          {
            error: {
              message: "Rate limit hit",
            },
          },
          { status: 429 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_1",
          output_text: "Recovered after retry",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const requestPromise = client.request({
      model: "gpt-4.1-mini",
    });

    await vi.runAllTimersAsync();

    await expect(requestPromise).resolves.toEqual({
      id: "resp_1",
      output_text: "Recovered after retry",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries transport timeouts and then succeeds", async () => {
    const client = createClient();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("Timed out", "AbortError"))
      .mockResolvedValueOnce(
        Response.json({
          id: "resp_2",
          output_text: "Recovered after timeout",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const requestPromise = client.request({
      model: "gpt-4.1-mini",
    });

    await vi.runAllTimersAsync();

    await expect(requestPromise).resolves.toEqual({
      id: "resp_2",
      output_text: "Recovered after timeout",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable 400 responses", async () => {
    const client = createClient();
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        {
          error: {
            message: "Bad request",
          },
        },
        { status: 400 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      client.request({
        model: "gpt-4.1-mini",
      }),
    ).rejects.toMatchObject({
      message: "Bad request",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
