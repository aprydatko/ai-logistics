import { Module } from "@nestjs/common";

import { AiLogsModule } from "../ai-logs/ai-logs.module";
import { AuthModule } from "../auth/auth.module";
import { DriversModule } from "../drivers/drivers.module";
import { IncidentsModule } from "../incidents/incidents.module";
import { LoadsModule } from "../loads/loads.module";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";

@Module({
  imports: [AuthModule, AiLogsModule, DriversModule, LoadsModule, IncidentsModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
