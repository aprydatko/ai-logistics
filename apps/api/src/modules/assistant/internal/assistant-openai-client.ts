import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Environment } from "../../../config/environment";
import type { OpenAIResponseBody } from "./assistant.types";

@Injectable()
export class AssistantOpenAIClient {
  constructor(
    private readonly configService: ConfigService<Environment, true>,
  ) {}

  async request(body: Record<string, unknown>): Promise<OpenAIResponseBody> {
    const apiKey = this.configService.get("OPENAI_API_KEY", { infer: true });
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseBody =
      ((await response.json().catch(() => null)) as OpenAIResponseBody | null) ??
      {};

    if (!response.ok) {
      throw new InternalServerErrorException(
        responseBody.error?.message || "OpenAI request failed.",
      );
    }

    return responseBody;
  }
}
