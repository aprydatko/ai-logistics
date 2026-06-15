import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { IncidentsController } from "./incidents.controller";
import { IncidentsGateway } from "./incidents.gateway";
import { IncidentsService } from "./incidents.service";

@Module({
  imports: [AuthModule],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsGateway],
})
export class IncidentsModule {}
