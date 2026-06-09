import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type { LoadRecord } from "../../db/schema";
import { UpdateLoadDto } from "./dto/update-load.dto";
import { LoadsService } from "./loads.service";

const load: LoadRecord = {
  id: "22222222-2222-2222-2222-222222222222",
  referenceNumber: "LD-1001",
  pickupAddress: "Chicago, IL",
  deliveryAddress: "Detroit, MI",
  pickupDate: new Date("2026-06-10T10:00:00.000Z"),
  deliveryDate: new Date("2026-06-11T10:00:00.000Z"),
  weight: 24000,
  price: "2500.00",
  miles: 283,
  notes: null,
  status: "pending",
  broker: {
    id: "broker-1",
    companyName: "Acme Logistics",
    phone: "+12025550123",
  },
  driverId: null,
  createdAt: new Date("2026-06-09T10:00:00.000Z"),
  updatedAt: new Date("2026-06-09T10:00:00.000Z"),
};

const createUpdateService = (updateResult: unknown[]) => {
  const updateChain = {
    set: vi.fn(),
    where: vi.fn(),
    returning: vi.fn().mockResolvedValue(updateResult),
  };
  updateChain.set.mockReturnValue(updateChain);
  updateChain.where.mockReturnValue(updateChain);
  const client = {
    update: vi.fn().mockReturnValue(updateChain),
  };

  return {
    service: new LoadsService({
      client,
    } as unknown as ConstructorParameters<typeof LoadsService>[0]),
    updateChain,
  };
};

describe("LoadsService", () => {
  it("updates and serializes a load", async () => {
    const { service, updateChain } = createUpdateService([load]);

    await expect(service.update(load.id, { status: "assigned" })).resolves.toEqual({
      success: true,
      data: {
        ...load,
        price: 2500,
        pickupDate: load.pickupDate.toISOString(),
        deliveryDate: load.deliveryDate.toISOString(),
        createdAt: load.createdAt.toISOString(),
        updatedAt: load.updatedAt.toISOString(),
      },
    });
    expect(updateChain.set).toHaveBeenCalledWith({
      status: "assigned",
      referenceNumber: undefined,
      pickupAddress: undefined,
      deliveryAddress: undefined,
      pickupDate: undefined,
      deliveryDate: undefined,
      price: undefined,
      notes: undefined,
      updatedAt: expect.any(Date),
    });
  });

  it("rejects an empty update", async () => {
    const { service } = createUpdateService([]);

    await expect(service.update(load.id, new UpdateLoadDto())).rejects.toThrow(
      BadRequestException,
    );
  });

  it("returns not found when the load does not exist", async () => {
    const { service } = createUpdateService([]);

    await expect(
      service.update(load.id, { status: "cancelled" }),
    ).rejects.toThrow(NotFoundException);
  });

  it("returns conflict for a duplicate reference number", async () => {
    const { service, updateChain } = createUpdateService([]);
    updateChain.returning.mockRejectedValue(
      Object.assign(new Error("duplicate"), { code: "23505" }),
    );

    await expect(
      service.update(load.id, { referenceNumber: "LD-1002" }),
    ).rejects.toThrow(ConflictException);
  });

  it("rejects delivery before pickup", async () => {
    const service = new LoadsService({
      client: {},
    } as unknown as ConstructorParameters<typeof LoadsService>[0]);

    await expect(
      service.create({
        referenceNumber: "LD-1002",
        pickupAddress: "Chicago, IL",
        deliveryAddress: "Detroit, MI",
        pickupDate: "2026-06-11T10:00:00.000Z",
        deliveryDate: "2026-06-10T10:00:00.000Z",
        weight: 24000,
        price: 2500,
        miles: 283,
        broker: load.broker,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
