import { Module } from "@nestjs/common";

import { QueueModule } from "../queue/queue.module";
import { CacheService } from "./cache.service";

@Module({
  imports: [QueueModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
