import { describe, expect, it, vi } from "vitest";

import { MetricsController } from "./metrics.controller";

describe("MetricsController", () => {
  it("returns scrapeable metrics text", async () => {
    const metrics = "# HELP test_metric Example\n# TYPE test_metric counter";
    const controller = new MetricsController({
      getMetrics: vi.fn().mockResolvedValue(metrics),
    } as never);

    await expect(controller.getMetrics()).resolves.toBe(metrics);
  });
});
