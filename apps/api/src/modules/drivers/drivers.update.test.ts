import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type { DriverRecord } from "../../db/schema";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { DriversService } from "./drivers.service";

const driver: DriverRecord = {
  id: "22222222-2222-2222-2222-222222222222",
  userId: "11111111-1111-1111-1111-111111111111",
  firstName: "John",
  lastName: "Smith",
  phone: "+12025550123",
  truckNumber: "TR-1001",
  trailerNumber: "TL-1001",
  isActive: false,
  status: "off_duty",
  currentLocation: null,
  createdAt: new Date("2026-06-01T10:00:00.000Z"),
  updatedAt: new Date("2026-06-07T10:00:00.000Z"),
};

const createService = (updateResult: unknown[]) => {
  const updateChain = {
    set: vi.fn(),
    where: vi.fn(),
    returning: vi.fn().mockResolvedValue(updateResult),
  };
  updateChain.set.mockReturnValue(updateChain);
  updateChain.where.mockReturnValue(updateChain);

  const client = {
    update: vi.fn().mockReturnValue(updateChain),
    select: vi.fn(),
  };
  const service = new DriversService({
    client,
  } as unknown as ConstructorParameters<typeof DriversService>[0]);

  return { service, updateChain };
};

describe("DriversService.update", () => {
  it("updates and returns the driver", async () => {
    const { service, updateChain } = createService([driver]);

    await expect(
      service.update(driver.id, { isActive: false }),
    ).resolves.toEqual({
      success: true,
      data: {
        ...driver,
        currentLocation: undefined,
        createdAt: driver.createdAt.toISOString(),
        updatedAt: driver.updatedAt.toISOString(),
      },
    });
    expect(updateChain.set).toHaveBeenCalledWith({
      isActive: false,
      updatedAt: expect.any(Date),
    });
  });

  it("rejects an empty update", async () => {
    const { service } = createService([]);
    const emptyDto = new UpdateDriverDto();

    await expect(service.update(driver.id, emptyDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("returns not found when the driver does not exist", async () => {
    const { service } = createService([]);

    await expect(
      service.update(driver.id, { firstName: "James" }),
    ).rejects.toThrow(NotFoundException);
  });

  it("returns conflict for duplicate values", async () => {
    const { service, updateChain } = createService([]);
    updateChain.returning.mockRejectedValue(
      Object.assign(new Error("duplicate"), { code: "23505" }),
    );

    await expect(
      service.update(driver.id, { truckNumber: "TR-1002" }),
    ).rejects.toThrow(ConflictException);
  });
});
