import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CacheModule } from "../cache/cache.module";
import { LoadsController } from "./loads.controller";
import { LoadsService } from "./loads.service";

@Module({
  imports: [AuthModule, CacheModule],
  controllers: [LoadsController],
  providers: [LoadsService],
  exports: [LoadsService],
})
export class LoadsModule {}
