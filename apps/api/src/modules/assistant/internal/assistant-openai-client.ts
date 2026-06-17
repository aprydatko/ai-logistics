import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Environment } from "../../../config/environment";
import type { OpenAIResponseBody } from "./assistant.types";

const OPENAI_RESPONSE_URL = "https://api.openai.com/v1/responses";
const OPENAI_REQUEST_TIMEOUT_MS = 15_000;
const OPENAI_MAX_ATTEMPTS = 3;
const OPENAI_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const OPENAI_INITIAL_BACKOFF_MS = 300;

@Injectable()
export class AssistantOpenAIClient {
  constructor(
    private readonly configService: ConfigService<Environment, true>,
  ) {}

  /**
   * Makes a request to the OpenAI Responses API.
   * Handles authentication and error response parsing.
   *
   * @param body - The request body to send to OpenAI
   * @returns Promise resolving to the OpenAI response body
   * @throws InternalServerErrorException if the request fails
   */
  async request(body: Record<string, unknown>): Promise<OpenAIResponseBody> {
    const apiKey = this.configService.get("OPENAI_API_KEY", { infer: true });
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= OPENAI_MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        OPENAI_REQUEST_TIMEOUT_MS,
      );

      try {
        const response = await fetch(OPENAI_RESPONSE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const responseBody =
          ((await response
            .json()
            .catch(() => null)) as OpenAIResponseBody | null) ?? {};

        if (response.ok) {
          return responseBody;
        }

        lastError = new InternalServerErrorException(
          responseBody.error?.message || "OpenAI request failed.",
        );

        if (
          attempt < OPENAI_MAX_ATTEMPTS &&
          OPENAI_RETRYABLE_STATUSES.has(response.status)
        ) {
          await this.delay(this.getBackoffDelayMs(attempt));
          continue;
        }

        throw lastError;
      } catch (error: unknown) {
        lastError =
          error instanceof Error ? error : new Error("OpenAI request failed.");

        if (
          attempt < OPENAI_MAX_ATTEMPTS &&
          this.isRetryableTransportError(lastError)
        ) {
          await this.delay(this.getBackoffDelayMs(attempt));
          continue;
        }

        throw new InternalServerErrorException(
          this.isTimeoutError(lastError)
            ? "OpenAI request timed out."
            : lastError.message || "OpenAI request failed.",
        );
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new InternalServerErrorException(
      lastError?.message || "OpenAI request failed.",
    );
  }

  private isRetryableTransportError(error: Error): boolean {
    return this.isTimeoutError(error) || error.name === "TypeError";
  }

  private isTimeoutError(error: Error): boolean {
    return error.name === "AbortError";
  }

  private getBackoffDelayMs(attempt: number): number {
    return OPENAI_INITIAL_BACKOFF_MS * 2 ** (attempt - 1);
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
