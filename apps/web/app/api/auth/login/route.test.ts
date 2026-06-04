import type { AuthResponseDto, LoginDto, User } from "@repo/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const validLoginDto: LoginDto = {
  email: "dispatcher@example.com",
  password: "password123",
};

const user: User = {
  id: "user_1",
  firstName: "Alex",
  lastName: "Morgan",
  email: "dispatcher@example.com",
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
  new Request("https://app.example.com/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

const mockFetch = (response: Response): void => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
};

describe("POST /api/auth/login", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 for an invalid login request", async () => {
    const response = await POST(createJsonRequest({ email: "bad", password: "short" }));

    await expect(response.json()).resolves.toEqual({
      message: "Invalid login request",
    });
    expect(response.status).toBe(400);
  });

  it("returns 401 when the backend rejects credentials", async () => {
    mockFetch(Response.json({ message: "Unauthorized" }, { status: 401 }));

    const response = await POST(createJsonRequest(validLoginDto));

    await expect(response.json()).resolves.toEqual({
      message: "Invalid email or password",
    });
    expect(response.status).toBe(401);
  });

  it("returns 502 when the backend login request fails unexpectedly", async () => {
    mockFetch(Response.json({ message: "Server error" }, { status: 500 }));

    const response = await POST(createJsonRequest(validLoginDto));

    await expect(response.json()).resolves.toEqual({
      message: "Invalid email or password",
    });
    expect(response.status).toBe(502);
  });

  it("returns 502 when the backend response has an invalid auth shape", async () => {
    mockFetch(Response.json({ accessToken: "", refreshToken: "", user: null }));

    const response = await POST(createJsonRequest(validLoginDto));

    await expect(response.json()).resolves.toEqual({
      message: "Invalid authentication response",
    });
    expect(response.status).toBe(502);
  });

  it("returns 503 when the authentication service is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await POST(createJsonRequest(validLoginDto));

    await expect(response.json()).resolves.toEqual({
      message: "Authentication service unavailable",
    });
    expect(response.status).toBe(503);
  });

  it("returns the user and sets auth cookies after a successful login", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(authResponse));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(createJsonRequest(validLoginDto));

    await expect(response.json()).resolves.toEqual({ user });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(validLoginDto),
        cache: "no-store",
      }),
    );
    expect(response.cookies.get("access_token")?.value).toBe("access-token");
    expect(response.cookies.get("access_token")?.maxAge).toBe(15 * 60);
    expect(response.cookies.get("refresh_token")?.value).toBe("refresh-token");
    expect(response.cookies.get("refresh_token")?.maxAge).toBe(7 * 24 * 60 * 60);
  });
});
