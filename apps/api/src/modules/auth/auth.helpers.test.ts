import type { Request } from "express";
import { describe, expect, it, vi } from "vitest";

import type { DatabaseService } from "../../db/database.service";
import type { UserRecord } from "../../db/schema";
import {
  extractAccessToken,
  findActiveUserById,
  isAccessTokenPayload,
} from "./auth.helpers";

const buildRequest = (headers: Record<string, string> = {}): Request =>
  ({ headers }) as unknown as Request;

describe("extractAccessToken", () => {
  it("returns the Bearer token from the Authorization header", () => {
    const request = buildRequest({ authorization: "Bearer abc.def.ghi" });

    expect(extractAccessToken(request)).toBe("abc.def.ghi");
  });

  it("ignores non-Bearer authorization schemes", () => {
    const request = buildRequest({ authorization: "Basic dXNlcjpwYXNz" });

    expect(extractAccessToken(request)).toBeUndefined();
  });

  it("falls back to the access_token cookie when no header is present", () => {
    const request = buildRequest({
      cookie: "other=1; access_token=cookie-token; trail=2",
    });

    expect(extractAccessToken(request)).toBe("cookie-token");
  });

  it("prefers the Authorization header over the cookie", () => {
    const request = buildRequest({
      authorization: "Bearer header-token",
      cookie: "access_token=cookie-token",
    });

    expect(extractAccessToken(request)).toBe("header-token");
  });

  it("returns undefined when neither header nor cookie is set", () => {
    expect(extractAccessToken(buildRequest())).toBeUndefined();
  });

  it("returns undefined when only unrelated cookies are present", () => {
    const request = buildRequest({ cookie: "session=abc; theme=dark" });

    expect(extractAccessToken(request)).toBeUndefined();
  });
});

describe("isAccessTokenPayload", () => {
  it("returns true for a fully-valid access payload", () => {
    const payload = {
      email: "user@example.com",
      role: "admin",
      sub: "user-1",
      tokenType: "access",
    };

    expect(isAccessTokenPayload(payload)).toBe(true);
  });

  it("rejects a refresh token payload", () => {
    const payload = {
      sub: "user-1",
      tokenType: "refresh",
    };

    expect(isAccessTokenPayload(payload)).toBe(false);
  });

  it("rejects when sub is missing or empty", () => {
    expect(
      isAccessTokenPayload({
        email: "a@b.c",
        role: "admin",
        tokenType: "access",
      }),
    ).toBe(false);

    expect(
      isAccessTokenPayload({
        email: "a@b.c",
        role: "admin",
        sub: "",
        tokenType: "access",
      }),
    ).toBe(false);
  });

  it("rejects unknown roles", () => {
    const payload = {
      email: "a@b.c",
      role: "superuser",
      sub: "user-1",
      tokenType: "access",
    };

    expect(isAccessTokenPayload(payload)).toBe(false);
  });

  it("rejects non-object values", () => {
    expect(isAccessTokenPayload(null)).toBe(false);
    expect(isAccessTokenPayload(undefined)).toBe(false);
    expect(isAccessTokenPayload("string")).toBe(false);
  });
});

describe("findActiveUserById", () => {
  const baseRecord = {
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    email: "user@example.com",
    firstName: "Alex",
    id: "user-1",
    isActive: true,
    lastName: "Morgan",
    passwordHash: "hashed",
    role: "dispatcher",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  } satisfies UserRecord;

  const buildClient = (rows: UserRecord[]) => {
    const limit = vi.fn().mockResolvedValue(rows);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });

    return {
      client: { select } as unknown as DatabaseService["client"],
      from,
      limit,
      select,
      where,
    };
  };

  it("returns an AuthenticatedUser when the user exists and is active", async () => {
    const { client, from, limit, select, where } = buildClient([baseRecord]);

    const user = await findActiveUserById(
      { client } as DatabaseService,
      "user-1",
    );

    expect(user).toEqual({
      email: "user@example.com",
      id: "user-1",
      role: "dispatcher",
    });
    expect(select).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledTimes(1);
    expect(limit).toHaveBeenCalledWith(1);
  });

  it("returns undefined when no user matches", async () => {
    const { client } = buildClient([]);

    const user = await findActiveUserById(
      { client } as DatabaseService,
      "missing",
    );

    expect(user).toBeUndefined();
  });

  it("returns undefined when the user is inactive", async () => {
    const { client } = buildClient([{ ...baseRecord, isActive: false }]);

    const user = await findActiveUserById(
      { client } as DatabaseService,
      "user-1",
    );

    expect(user).toBeUndefined();
  });
});
