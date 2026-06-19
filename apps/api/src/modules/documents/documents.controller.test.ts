import { GUARDS_METADATA } from "@nestjs/common/constants";
import {
  THROTTLER_LIMIT,
  THROTTLER_TTL,
} from "@nestjs/throttler/dist/throttler.constants";
import { minutes } from "@nestjs/throttler";
import { describe, expect, it } from "vitest";

import { ROLES_KEY } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { DocumentsController } from "./documents.controller";

describe("DocumentsController mutations", () => {
  it.each(["create", "update", "remove"] as const)(
    "restricts %s to operations roles",
    (method) => {
      expect(
        Reflect.getMetadata(ROLES_KEY, DocumentsController.prototype[method]),
      ).toEqual(["admin", "dispatcher"]);
      expect(
        Reflect.getMetadata(
          GUARDS_METADATA,
          DocumentsController.prototype[method],
        ),
      ).toContain(RolesGuard);
    },
  );

  it("rate limits upload", () => {
    expect(
      Reflect.getMetadata(
        `${THROTTLER_LIMIT}default`,
        DocumentsController.prototype.upload,
      ),
    ).toBe(5);
    expect(
      Reflect.getMetadata(
        `${THROTTLER_TTL}default`,
        DocumentsController.prototype.upload,
      ),
    ).toBe(minutes(10));
  });

  it.each(["initiateUpload", "completeUpload"] as const)(
    "rate limits %s",
    (method) => {
      expect(
        Reflect.getMetadata(
          `${THROTTLER_LIMIT}default`,
          DocumentsController.prototype[method],
        ),
      ).toBe(10);
      expect(
        Reflect.getMetadata(
          `${THROTTLER_TTL}default`,
          DocumentsController.prototype[method],
        ),
      ).toBe(minutes(10));
    },
  );
});
