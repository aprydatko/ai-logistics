import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LoadsController } from "./loads.controller";
import { LoadsService } from "./loads.service";

@Module({
  imports: [AuthModule],
  controllers: [LoadsController],
  providers: [LoadsService],
})
export class LoadsModule {}
