import { Module } from "@nestjs/common";

import { QueueModule } from "../queue/queue.module";
import { HealthController } from "./health.controller";
import { RedisHealthService } from "./redis-health.service";

@Module({
  imports: [QueueModule],
  controllers: [HealthController],
  providers: [RedisHealthService],
})
export class HealthModule {}
