import type { AuthResponseDto, RegisterDto, User } from "@repo/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const validRegisterDto: RegisterDto = {
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  password: "password123",
};

const user: User = {
  id: "user_1",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  role: "dispatcher",
  isActive: true,
  createdAt: "2026-06-04T10:00:00.000Z",
  updatedAt: "2026-06-04T10:00:00.000Z",
};

const authResponse: AuthResponseDto = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  user,
};

const createJsonRequest = (body: unknown): Request =>
  new Request("https://app.example.com/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/auth/register", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 for an invalid registration request", async () => {
    const response = await POST(
      createJsonRequest({ ...validRegisterDto, email: "bad", password: "short" }),
    );

    await expect(response.json()).resolves.toEqual({
      message: "Invalid registration request",
    });
    expect(response.status).toBe(400);
  });

  it("returns 409 when the backend reports an existing account", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Conflict" }, { status: 409 })),
    );

    const response = await POST(createJsonRequest(validRegisterDto));

    await expect(response.json()).resolves.toEqual({
      message: "Unable to create account",
    });
    expect(response.status).toBe(409);
  });

  it("returns 502 when the backend registration request fails unexpectedly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Server error" }, { status: 500 })),
    );

    const response = await POST(createJsonRequest(validRegisterDto));

    await expect(response.json()).resolves.toEqual({
      message: "Unable to create account",
    });
    expect(response.status).toBe(502);
  });

  it("returns 502 when automatic sign-in fails after registration", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ id: "created-user" }))
        .mockResolvedValueOnce(
          Response.json({ message: "Unauthorized" }, { status: 401 }),
        ),
    );

    const response = await POST(createJsonRequest(validRegisterDto));

    await expect(response.json()).resolves.toEqual({
      message: "Account created, but automatic sign-in failed",
    });
    expect(response.status).toBe(502);
  });

  it("returns 502 when the automatic sign-in response has an invalid auth shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ id: "created-user" }))
        .mockResolvedValueOnce(
          Response.json({ accessToken: "", refreshToken: "", user: null }),
        ),
    );

    const response = await POST(createJsonRequest(validRegisterDto));

    await expect(response.json()).resolves.toEqual({
      message: "Invalid authentication response",
    });
    expect(response.status).toBe(502);
  });

  it("returns 503 when the authentication service is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await POST(createJsonRequest(validRegisterDto));

    await expect(response.json()).resolves.toEqual({
      message: "Authentication service unavailable",
    });
    expect(response.status).toBe(503);
  });

  it("returns the user and sets auth cookies after registration and sign-in", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ id: "created-user" }))
      .mockResolvedValueOnce(Response.json(authResponse));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(createJsonRequest(validRegisterDto));

    await expect(response.json()).resolves.toEqual({ user });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3001/api/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(validRegisterDto),
        cache: "no-store",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3001/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: validRegisterDto.email,
          password: validRegisterDto.password,
        }),
        cache: "no-store",
      }),
    );
    expect(response.cookies.get("access_token")?.value).toBe("access-token");
    expect(response.cookies.get("access_token")?.maxAge).toBe(15 * 60);
    expect(response.cookies.get("refresh_token")?.value).toBe("refresh-token");
    expect(response.cookies.get("refresh_token")?.maxAge).toBe(7 * 24 * 60 * 60);
  });
});
