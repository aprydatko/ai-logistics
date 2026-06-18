import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type { DriverRecord } from "../../db/schema";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { DriversService } from "./drivers.service";

const cacheService = {
  getOrSet: vi.fn(async (_key, _ttl, factory) => factory()),
  invalidateNamespace: vi.fn().mockResolvedValue(undefined),
};

const driver: DriverRecord = {
  id: "22222222-2222-2222-2222-222222222222",
  driverCode: "DR-1001",
  email: "john.smith@example.com",
  userId: "11111111-1111-1111-1111-111111111111",
  firstName: "John",
  lastName: "Smith",
  phone: "+12025550123",
  avatarUrl: null,
  dateOfBirth: null,
  address: null,
  hireDate: null,
  licenseType: "CDL-A",
  licenseNumber: "A123456789",
  licenseExpirationDate: "2028-08-12",
  licenseState: "Texas",
  emergencyContact: null,
  emergencyPhone: null,
  notes: null,
  rating: "4.8",
  truckNumber: "TR-1001",
  trailerNumber: "TL-1001",
  isActive: false,
  status: "off_duty",
  currentLocation: null,
  createdAt: new Date("2026-06-01T10:00:00.000Z"),
  updatedAt: new Date("2026-06-07T10:00:00.000Z"),
};

const createService = (updateResult: unknown[]) => {
  const currentDriverChain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn().mockResolvedValue(updateResult.length ? [driver] : []),
  };
  currentDriverChain.from.mockReturnValue(currentDriverChain);
  currentDriverChain.where.mockReturnValue(currentDriverChain);

  const updateChain = {
    set: vi.fn(),
    where: vi.fn(),
    returning: vi.fn().mockResolvedValue(updateResult),
  };
  updateChain.set.mockReturnValue(updateChain);
  updateChain.where.mockReturnValue(updateChain);

  const activityInsertChain = {
    values: vi.fn().mockResolvedValue(undefined),
  };

  const client = {
    select: vi.fn().mockReturnValue(currentDriverChain),
    transaction: vi.fn(async (callback) =>
      callback({
        select: vi.fn().mockReturnValue(currentDriverChain),
        update: vi.fn().mockReturnValue(updateChain),
        insert: vi.fn().mockReturnValue(activityInsertChain),
      }),
    ),
  };
  const service = new DriversService({
    client,
  } as unknown as ConstructorParameters<typeof DriversService>[0], cacheService as never);

  return { client, service, updateChain };
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
        rating: 4.8,
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
    const { client, service } = createService([driver]);
    client.transaction.mockRejectedValue(
      Object.assign(new Error("duplicate"), { code: "23505" }),
    );

    await expect(
      service.update(driver.id, { truckNumber: "TR-1002" }),
    ).rejects.toThrow(ConflictException);
  });
});
