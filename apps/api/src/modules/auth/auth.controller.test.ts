import {
  THROTTLER_LIMIT,
  THROTTLER_TTL,
} from "@nestjs/throttler/dist/throttler.constants";
import { minutes } from "@nestjs/throttler";
import { describe, expect, it } from "vitest";

import { AuthController } from "./auth.controller";

describe("AuthController throttling", () => {
  it("rate limits register", () => {
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        AuthController.prototype.register,
      ),
    ).toBe(3);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_TTL}default`,
        AuthController.prototype.register,
      ),
    ).toBe(minutes(15));
  });

  it("rate limits login", () => {
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        AuthController.prototype.login,
      ),
    ).toBe(5);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_TTL}default`,
        AuthController.prototype.login,
      ),
    ).toBe(minutes(1));
  });

  it("rate limits refresh", () => {
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        AuthController.prototype.refresh,
      ),
    ).toBe(20);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_TTL}default`,
        AuthController.prototype.refresh,
      ),
    ).toBe(minutes(1));
  });

  it("rate limits socket token issuance", () => {
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        AuthController.prototype.createSocketToken,
      ),
    ).toBe(30);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_TTL}default`,
        AuthController.prototype.createSocketToken,
      ),
    ).toBe(minutes(1));
  });
});
