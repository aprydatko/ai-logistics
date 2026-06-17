import { Module } from "@nestjs/common";

import { AiLogsModule } from "../ai-logs/ai-logs.module";
import { AuthModule } from "../auth/auth.module";
import { DriversModule } from "../drivers/drivers.module";
import { IncidentsModule } from "../incidents/incidents.module";
import { LoadsModule } from "../loads/loads.module";
import { AssistantAuditService } from "./assistant-audit.service";
import { AssistantController } from "./assistant.controller";
import { AssistantOpenAIClient } from "./internal/assistant-openai-client";
import { AssistantService } from "./assistant.service";
import { AssistantToolsService } from "./assistant-tools.service";

@Module({
  imports: [
    AuthModule,
    AiLogsModule,
    DriversModule,
    LoadsModule,
    IncidentsModule,
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    AssistantToolsService,
    AssistantOpenAIClient,
    AssistantAuditService,
  ],
})
export class AssistantModule {}
