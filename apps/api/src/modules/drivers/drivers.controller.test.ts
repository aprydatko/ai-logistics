import { GUARDS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it } from "vitest";

import { ROLES_KEY } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { DriversController } from "./drivers.controller";

describe("DriversController.findById", () => {
  it("restricts driver details to operations roles", () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, DriversController.prototype.findById),
    ).toEqual(["admin", "dispatcher"]);
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        DriversController.prototype.findById,
      ),
    ).toContain(RolesGuard);
  });
});
