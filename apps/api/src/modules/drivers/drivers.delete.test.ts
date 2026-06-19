import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { DriversService } from "./drivers.service";

const cacheService = {
  getOrSet: vi.fn(async (_namespace, _key, _ttl, factory) => factory()),
  getTtl: vi.fn((kind: "list" | "detail" | "metrics") =>
    kind === "detail" ? 60 : 30,
  ),
  invalidateNamespace: vi.fn().mockResolvedValue(undefined),
};

const driverId = "22222222-2222-2222-2222-222222222222";

const createService = (deleteResult: unknown[]) => {
  const deleteChain = {
    where: vi.fn(),
    returning: vi.fn().mockResolvedValue(deleteResult),
  };
  deleteChain.where.mockReturnValue(deleteChain);

  const client = {
    delete: vi.fn().mockReturnValue(deleteChain),
  };
  const service = new DriversService({
    client,
  } as unknown as ConstructorParameters<typeof DriversService>[0], cacheService as never);

  return { client, service };
};

describe("DriversService.remove", () => {
  it("deletes an existing driver", async () => {
    const { client, service } = createService([{ id: driverId }]);

    await expect(service.remove(driverId)).resolves.toEqual({
      success: true,
      message: "Driver deleted",
    });
    expect(client.delete).toHaveBeenCalledTimes(1);
  });

  it("returns not found when the driver does not exist", async () => {
    const { service } = createService([]);

    await expect(service.remove(driverId)).rejects.toThrow(NotFoundException);
  });
});
