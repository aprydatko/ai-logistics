import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "./auth.types";
import { RolesGuard } from "./roles.guard";

const createExecutionContext = (
  user?: AuthenticatedUser,
): ExecutionContext =>
  ({
    getClass: vi.fn(),
    getHandler: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe("RolesGuard", () => {
  it("allows access when no roles are required", () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createExecutionContext())).toBe(true);
  });

  it("allows access when the user has a required role", () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(["admin", "dispatcher"]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(
      guard.canActivate(
        createExecutionContext({
          id: "user_1",
          email: "dispatcher@example.com",
          role: "dispatcher",
        }),
      ),
    ).toBe(true);
  });

  it("rejects access when the user role is not allowed", () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(["admin"]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(
        createExecutionContext({
          id: "user_1",
          email: "driver@example.com",
          role: "driver",
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
