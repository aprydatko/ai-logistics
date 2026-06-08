import { ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type { DriverRecord } from "../../db/schema";
import { DriversService } from "./drivers.service";

const dto = {
  driverCode: " DR-1001 ",
  email: " JOHN.SMITH@EXAMPLE.COM ",
  firstName: " John ",
  lastName: " Smith ",
  phone: " +12025550123 ",
  licenseType: "CDL-A",
  licenseNumber: "A123456789",
  licenseExpirationDate: "2028-08-12",
  licenseState: "Texas",
  truckNumber: " TR-1001 ",
  trailerNumber: " TL-1001 ",
  isActive: true,
  status: "available" as const,
};

const driverRecord: DriverRecord = {
  id: "22222222-2222-2222-2222-222222222222",
  userId: null,
  ...dto,
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
  currentLocation: null,
  createdAt: new Date("2026-06-07T10:00:00.000Z"),
  updatedAt: new Date("2026-06-07T10:00:00.000Z"),
};

const createService = (selectResult: unknown[], insertResult: unknown[]) => {
  const selectChain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn().mockResolvedValue(selectResult),
  };
  selectChain.from.mockReturnValue(selectChain);
  selectChain.where.mockReturnValue(selectChain);

  const insertChain = {
    values: vi.fn(),
    returning: vi.fn().mockResolvedValue(insertResult),
  };
  insertChain.values.mockReturnValue(insertChain);

  const client = {
    select: vi.fn().mockReturnValue(selectChain),
    insert: vi.fn().mockReturnValue(insertChain),
  };
  const service = new DriversService({
    client,
  } as unknown as ConstructorParameters<typeof DriversService>[0]);

  return { insertChain, service };
};

describe("DriversService.create", () => {
  it("creates a driver with normalized values", async () => {
    const { insertChain, service } = createService([], [driverRecord]);

    await expect(service.create(dto)).resolves.toEqual({
      success: true,
      data: {
        ...driverRecord,
        rating: 4.8,
        currentLocation: undefined,
        createdAt: driverRecord.createdAt.toISOString(),
        updatedAt: driverRecord.updatedAt.toISOString(),
      },
    });
    expect(insertChain.values).toHaveBeenCalledWith({
      ...dto,
      firstName: "John",
      lastName: "Smith",
      driverCode: "DR-1001",
      email: "john.smith@example.com",
      phone: "+12025550123",
      address: null,
      emergencyContact: null,
      emergencyPhone: null,
      licenseNumber: "A123456789",
      licenseState: "Texas",
      licenseType: "CDL-A",
      notes: null,
      truckNumber: "TR-1001",
      trailerNumber: "TL-1001",
    });
  });

  it("returns conflict for duplicate driver data", async () => {
    const { service } = createService([], []);
    const error = Object.assign(new Error("duplicate"), { code: "23505" });
    const insert = (
      service as unknown as {
        databaseService: { client: { insert: ReturnType<typeof vi.fn> } };
      }
    ).databaseService.client.insert;
    insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(error),
      }),
    });

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });
});
