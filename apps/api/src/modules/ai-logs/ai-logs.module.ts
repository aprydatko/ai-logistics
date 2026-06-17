import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AiLogsController } from "./ai-logs.controller";
import { AiLogsService } from "./ai-logs.service";

@Module({
  imports: [AuthModule],
  controllers: [AiLogsController],
  providers: [AiLogsService],
  exports: [AiLogsService],
})
export class AiLogsModule {}
