import { THROTTLER_SKIP } from "@nestjs/throttler/dist/throttler.constants";
import { describe, expect, it, vi } from "vitest";

import { MetricsController } from "./metrics.controller";

describe("MetricsController", () => {
  it("skips global throttling for metrics scrapes", () => {
    expect(
      Reflect.getMetadata(`${THROTTLER_SKIP}default`, MetricsController),
    ).toBe(true);
  });

  it("returns scrapeable metrics text", async () => {
    const metrics = "# HELP test_metric Example\n# TYPE test_metric counter";
    const controller = new MetricsController({
      getMetrics: vi.fn().mockResolvedValue(metrics),
    } as never);

    await expect(controller.getMetrics()).resolves.toBe(metrics);
  });
});
