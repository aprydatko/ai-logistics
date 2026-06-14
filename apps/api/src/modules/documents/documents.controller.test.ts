import { GUARDS_METADATA } from "@nestjs/common/constants";
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
});
