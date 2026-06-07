import { BadRequestException, ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type { DriverRecord } from "../../db/schema";
import { DriversService } from "./drivers.service";

const dto = {
  userId: "11111111-1111-1111-1111-111111111111",
  firstName: " John ",
  lastName: " Smith ",
  phone: " +12025550123 ",
  truckNumber: " TR-1001 ",
  trailerNumber: " TL-1001 ",
  isActive: true,
  status: "available" as const,
};

const driverRecord: DriverRecord = {
  id: "22222222-2222-2222-2222-222222222222",
  ...dto,
  firstName: "John",
  lastName: "Smith",
  phone: "+12025550123",
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
    const { insertChain, service } = createService(
      [{ id: dto.userId, role: "driver" }],
      [driverRecord],
    );

    await expect(service.create(dto)).resolves.toEqual({
      success: true,
      data: {
        ...driverRecord,
        currentLocation: undefined,
        createdAt: driverRecord.createdAt.toISOString(),
        updatedAt: driverRecord.updatedAt.toISOString(),
      },
    });
    expect(insertChain.values).toHaveBeenCalledWith({
      ...dto,
      firstName: "John",
      lastName: "Smith",
      phone: "+12025550123",
      truckNumber: "TR-1001",
      trailerNumber: "TL-1001",
    });
  });

  it("rejects a user that is not a driver", async () => {
    const { service } = createService(
      [{ id: dto.userId, role: "dispatcher" }],
      [],
    );

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it("returns conflict for duplicate driver data", async () => {
    const { service } = createService([{ id: dto.userId, role: "driver" }], []);
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
