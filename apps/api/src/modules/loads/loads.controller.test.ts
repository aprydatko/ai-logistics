import { GUARDS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it } from "vitest";

import { ROLES_KEY } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { LoadsController } from "./loads.controller";

describe("LoadsController mutations", () => {
  it.each(["assignDriver", "create", "update"] as const)(
    "restricts %s to operations roles",
    (method) => {
      expect(
        Reflect.getMetadata(ROLES_KEY, LoadsController.prototype[method]),
      ).toEqual(["admin", "dispatcher"]);
      expect(
        Reflect.getMetadata(
          GUARDS_METADATA,
          LoadsController.prototype[method],
        ),
      ).toContain(RolesGuard);
    },
  );
});
