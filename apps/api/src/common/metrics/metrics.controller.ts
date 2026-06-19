import { Controller, Get, Header } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

import { MetricsService } from "./metrics.service";

@Controller()
@SkipThrottle()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get("metrics")
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
