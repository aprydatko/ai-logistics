import { GUARDS_METADATA } from "@nestjs/common/constants";
import {
  THROTTLER_LIMIT,
  THROTTLER_TTL,
} from "@nestjs/throttler/dist/throttler.constants";
import { minutes } from "@nestjs/throttler";
import { describe, expect, it } from "vitest";

import { AuthenticatedThrottlerGuard } from "../auth/authenticated-throttler.guard";
import { AssistantController } from "./assistant.controller";

describe("AssistantController", () => {
  it("rate limits assistant responses", () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AssistantController.prototype.respond),
    ).toContain(AuthenticatedThrottlerGuard);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        AssistantController.prototype.respond,
      ),
    ).toBe(10);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_TTL}default`,
        AssistantController.prototype.respond,
      ),
    ).toBe(minutes(1));
  });
});
