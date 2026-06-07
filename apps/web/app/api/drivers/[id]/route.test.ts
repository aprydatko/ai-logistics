import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "access_token"
        ? { name, value: "valid-access-token" }
        : undefined,
  })),
}));

import { DELETE } from "./route";

describe("DELETE /api/drivers/:id", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deletes the driver through the authenticated API", async () => {
    const driverId = "8a7fb1f7-f3e8-4aba-8312-908dfac7f468";
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        message: "Driver deleted successfully",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await DELETE(
      new Request(`http://localhost/api/drivers/${driverId}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: driverId }) },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3001/api/drivers/${driverId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-access-token",
        },
        body: undefined,
        cache: "no-store",
      },
    );
  });
});
