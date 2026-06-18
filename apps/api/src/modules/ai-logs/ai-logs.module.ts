import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CacheModule } from "../cache/cache.module";
import { AiLogsController } from "./ai-logs.controller";
import { AiLogsService } from "./ai-logs.service";

@Module({
  imports: [AuthModule, CacheModule],
  controllers: [AiLogsController],
  providers: [AiLogsService],
  exports: [AiLogsService],
})
export class AiLogsModule {}
