import { GUARDS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it } from "vitest";

import { ROLES_KEY } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { IncidentsController } from "./incidents.controller";

describe("IncidentsController mutations", () => {
  it.each(["create", "update", "updateStatus", "updateTimeline"] as const)(
    "restricts %s to operations roles",
    (method) => {
      expect(
        Reflect.getMetadata(ROLES_KEY, IncidentsController.prototype[method]),
      ).toEqual(["admin", "dispatcher"]);
      expect(
        Reflect.getMetadata(
          GUARDS_METADATA,
          IncidentsController.prototype[method],
        ),
      ).toContain(RolesGuard);
    },
  );
});

describe("IncidentsController reads", () => {
  it.each(["findAll", "findOne", "findTimeline"] as const)(
    "does not restrict %s to operations roles",
    (method) => {
      expect(
        Reflect.getMetadata(ROLES_KEY, IncidentsController.prototype[method]),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata(
          GUARDS_METADATA,
          IncidentsController.prototype[method],
        ) ?? [],
      ).not.toContain(RolesGuard);
    },
  );
});
