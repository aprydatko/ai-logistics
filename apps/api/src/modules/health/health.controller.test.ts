import { describe, expect, it, vi } from "vitest";

import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns API health metadata", () => {
    const controller = new HealthController({
      client: {
        execute: vi.fn(),
      },
    } as unknown as ConstructorParameters<typeof HealthController>[0]);

    const response = controller.getHealth();

    expect(response.status).toBe("ok");
    expect(response.uptime).toEqual(expect.any(Number));
    expect(response.timestamp).toEqual(expect.any(String));
  });

  it("checks database reachability", async () => {
    const execute = vi.fn().mockResolvedValue([{ result: 1 }]);
    const controller = new HealthController({
      client: {
        execute,
      },
    } as unknown as ConstructorParameters<typeof HealthController>[0]);

    await expect(controller.getDatabaseHealth()).resolves.toEqual({
      status: "ok",
      database: "reachable",
    });
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
