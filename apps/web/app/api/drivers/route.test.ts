import { afterEach, describe, expect, it, vi } from "vitest";

const cookieValues = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name);
      return value ? { name, value } : undefined;
    },
  })),
}));

import { GET } from "./route";

const driversResponse = {
  data: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

describe("GET /api/drivers", () => {
  afterEach(() => {
    cookieValues.clear();
    vi.unstubAllGlobals();
  });

  it("refreshes an expired access token and retries the drivers request", async () => {
    cookieValues.set("access_token", "expired-access-token");
    cookieValues.set("refresh_token", "valid-refresh-token");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ message: "Unauthorized" }, { status: 401 }),
      )
      .mockResolvedValueOnce(
        Response.json({
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          user: {
            id: "user-id",
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            role: "dispatcher",
            isActive: true,
            createdAt: "2026-06-07T00:00:00.000Z",
            updatedAt: "2026-06-07T00:00:00.000Z",
          },
        }),
      )
      .mockResolvedValueOnce(Response.json(driversResponse));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new Request("http://localhost/api/drivers"));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://localhost:3001/api/auth/refresh",
    );
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
      headers: { Authorization: "Bearer new-access-token" },
    });
    expect(response.cookies.get("access_token")?.value).toBe(
      "new-access-token",
    );
    expect(response.cookies.get("refresh_token")?.value).toBe(
      "new-refresh-token",
    );
  });

  it("refreshes before loading drivers when the access cookie has expired", async () => {
    cookieValues.set("refresh_token", "valid-refresh-token");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          user: {
            id: "user-id",
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            role: "dispatcher",
            isActive: true,
            createdAt: "2026-06-07T00:00:00.000Z",
            updatedAt: "2026-06-07T00:00:00.000Z",
          },
        }),
      )
      .mockResolvedValueOnce(Response.json(driversResponse));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new Request("http://localhost/api/drivers"));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      headers: { Authorization: "Bearer new-access-token" },
    });
  });

  it("clears session cookies when the refresh token is invalid", async () => {
    cookieValues.set("refresh_token", "invalid-refresh-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ message: "Unauthorized" }, { status: 401 }),
      ),
    );

    const response = await GET(new Request("http://localhost/api/drivers"));

    expect(response.status).toBe(401);
    expect(response.cookies.get("access_token")?.value).toBe("");
    expect(response.cookies.get("refresh_token")?.value).toBe("");
  });
});
