import { describe, expect, it, vi } from "vitest";

import { DriversController } from "./drivers.controller";
import type { DriversService } from "./drivers.service";

describe("DriversController", () => {
  it("passes filters to the drivers service", async () => {
    const response = { success: true as const, data: [] };
    const service = {
      findAll: vi.fn().mockResolvedValue(response),
    } as unknown as DriversService;
    const controller = new DriversController(service);
    const query = {
      search: "smith",
      isActive: true,
      truckNumber: "TR-10",
      page: 2,
      limit: 10,
    };

    await expect(controller.findAll(query)).resolves.toEqual(response);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it("passes a new driver to the drivers service", async () => {
    const response = {
      success: true as const,
      data: { id: "driver-id" },
    };
    const service = {
      create: vi.fn().mockResolvedValue(response),
    } as unknown as DriversService;
    const controller = new DriversController(service);
    const dto = {
      userId: "11111111-1111-1111-1111-111111111111",
      firstName: "John",
      lastName: "Smith",
      phone: "+12025550123",
      truckNumber: "TR-1001",
      trailerNumber: "TL-1001",
      isActive: true,
    };

    await expect(controller.create(dto)).resolves.toEqual(response);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it("passes the driver id to the drivers service", async () => {
    const response = {
      success: true as const,
      data: { id: "driver-id", tripsHistory: [] },
    };
    const service = {
      findById: vi.fn().mockResolvedValue(response),
    } as unknown as DriversService;
    const controller = new DriversController(service);

    await expect(controller.findById("driver-id")).resolves.toEqual(response);
    expect(service.findById).toHaveBeenCalledWith("driver-id");
  });

  it("passes driver updates to the drivers service", async () => {
    const response = {
      success: true as const,
      data: { id: "driver-id", isActive: false },
    };
    const service = {
      update: vi.fn().mockResolvedValue(response),
    } as unknown as DriversService;
    const controller = new DriversController(service);
    const dto = { isActive: false };

    await expect(controller.update("driver-id", dto)).resolves.toEqual(
      response,
    );
    expect(service.update).toHaveBeenCalledWith("driver-id", dto);
  });
});
