import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { describe, expect, it, vi } from "vitest";

import type { DatabaseService } from "../../db/database.service";
import type { AccessTokenPayload, AuthenticatedUser } from "./auth.types";
import { JwtAuthGuard } from "./jwt-auth.guard";

const activeUser: AuthenticatedUser = {
  email: "admin@example.com",
  id: "11111111-1111-1111-1111-111111111111",
  role: "admin",
};

const buildJwtService = (verifyImpl: (token: string) => unknown): JwtService =>
  ({
    verifyAsync: vi.fn().mockImplementation((token: string) => {
      try {
        return Promise.resolve(verifyImpl(token));
      } catch (error) {
        return Promise.reject(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }),
  }) as unknown as JwtService;

interface MockUserRow {
  email: string | null;
  id: string | null;
  isActive: boolean;
  role: string | null;
}

const buildDatabaseService = (rows: MockUserRow[]): DatabaseService => {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });

  return {
    client: { select } as unknown as DatabaseService["client"],
  } as DatabaseService;
};

const buildContext = (
  headers: Record<string, string> = {},
): ExecutionContext => {
  const request = { headers } as unknown as Request;
  return {
    getClass: vi.fn(),
    getHandler: vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
};

describe("JwtAuthGuard.canActivate", () => {
  it("attaches the authenticated user and returns true on success", async () => {
    const jwtService = buildJwtService(
      () =>
        ({
          email: activeUser.email,
          role: activeUser.role,
          sub: activeUser.id,
          tokenType: "access",
        }) satisfies AccessTokenPayload,
    );
    const databaseService = buildDatabaseService([
      {
        email: activeUser.email,
        id: activeUser.id,
        isActive: true,
        role: activeUser.role,
      },
    ]);
    const guard = new JwtAuthGuard(jwtService, databaseService);
    const context = buildContext({ authorization: "Bearer good-token" });
    const request = context.switchToHttp().getRequest<
      Request & {
        user?: AuthenticatedUser;
      }
    >();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(activeUser);
  });

  it("rejects when no token is present", async () => {
    const jwtService = buildJwtService(() => null);
    const databaseService = buildDatabaseService([]);
    const guard = new JwtAuthGuard(jwtService, databaseService);

    await expect(guard.canActivate(buildContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects when JWT verification fails", async () => {
    const jwtService = buildJwtService(() => {
      throw new Error("jwt malformed");
    });
    const databaseService = buildDatabaseService([]);
    const guard = new JwtAuthGuard(jwtService, databaseService);

    await expect(
      guard.canActivate(buildContext({ authorization: "Bearer bad-token" })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects when the payload is not an access token", async () => {
    const jwtService = buildJwtService(() => ({
      sub: activeUser.id,
      tokenType: "refresh",
    }));
    const databaseService = buildDatabaseService([]);
    const guard = new JwtAuthGuard(jwtService, databaseService);

    await expect(
      guard.canActivate(buildContext({ authorization: "Bearer refresh" })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects when the referenced user is inactive", async () => {
    const jwtService = buildJwtService(() => ({
      email: activeUser.email,
      role: activeUser.role,
      sub: activeUser.id,
      tokenType: "access",
    }));
    const databaseService = buildDatabaseService([
      {
        email: activeUser.email,
        id: activeUser.id,
        isActive: false,
        role: activeUser.role,
      },
    ]);
    const guard = new JwtAuthGuard(jwtService, databaseService);

    await expect(
      guard.canActivate(buildContext({ authorization: "Bearer good-token" })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
