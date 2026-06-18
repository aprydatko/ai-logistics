import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type { DriverRecord, LoadRecord } from "../../db/schema";
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
  isActive: true,
  status: "available",
  currentLocation: null,
  createdAt: new Date("2026-06-01T10:00:00.000Z"),
  updatedAt: new Date("2026-06-02T10:00:00.000Z"),
};

const trip: LoadRecord = {
  id: "33333333-3333-3333-3333-333333333333",
  referenceNumber: "LD-1001",
  pickupAddress: "Chicago, IL",
  deliveryAddress: "Dallas, TX",
  pickupDate: new Date("2026-05-01T08:00:00.000Z"),
  deliveryDate: new Date("2026-05-03T18:00:00.000Z"),
  weight: 20000,
  price: "2500.50",
  miles: 925,
  notes: null,
  status: "delivered",
  broker: {
    id: "broker-1",
    companyName: "Acme Logistics",
    phone: "+12025550124",
  },
  routePoints: [],
  timeline: [],
  driverId: driver.id,
  createdAt: new Date("2026-04-25T10:00:00.000Z"),
  updatedAt: new Date("2026-05-03T18:00:00.000Z"),
};

const createSelectChain = (result: unknown[], withOrderBy = false) => {
  const chain = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    limit: vi.fn().mockResolvedValue(result),
    orderBy: vi.fn().mockResolvedValue(result),
  };
  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);

  if (withOrderBy) {
    chain.limit.mockReturnValue(chain);
  }

  return chain;
};

const createLimitedSelectChain = (result: unknown[]) => {
  const chain = createSelectChain(result);
  chain.orderBy.mockReturnValue(chain);
  return chain;
};

describe("DriversService.findById", () => {
  it("returns driver details with trip history", async () => {
    const client = {
      select: vi
        .fn()
        .mockReturnValueOnce(createSelectChain([driver]))
        .mockReturnValueOnce(createSelectChain([trip], true))
        .mockReturnValueOnce(createSelectChain([], true))
        .mockReturnValueOnce(createLimitedSelectChain([]))
        .mockReturnValueOnce(createLimitedSelectChain([])),
    };
    const service = new DriversService({
      client,
    } as unknown as ConstructorParameters<typeof DriversService>[0], cacheService as never);

    await expect(service.findById(driver.id)).resolves.toEqual({
      success: true,
      data: {
        ...driver,
        rating: 4.8,
        currentLocation: undefined,
        createdAt: driver.createdAt.toISOString(),
        updatedAt: driver.updatedAt.toISOString(),
        currentVehicle: null,
        documents: [],
        tripsHistory: [
          {
            ...trip,
            pickupDate: trip.pickupDate.toISOString(),
            deliveryDate: trip.deliveryDate.toISOString(),
            price: 2500.5,
            createdAt: trip.createdAt.toISOString(),
            updatedAt: trip.updatedAt.toISOString(),
          },
        ],
        activity: [],
      },
    });
  });

  it("returns not found when the driver does not exist", async () => {
    const client = {
      select: vi.fn().mockReturnValue(createSelectChain([])),
    };
    const service = new DriversService({
      client,
    } as unknown as ConstructorParameters<typeof DriversService>[0], cacheService as never);

    await expect(service.findById(driver.id)).rejects.toThrow(
      NotFoundException,
    );
    expect(client.select).toHaveBeenCalledTimes(1);
  });
});
