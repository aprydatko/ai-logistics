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
});
