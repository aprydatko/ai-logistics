import { Module } from "@nestjs/common";

import { AiLogsModule } from "../ai-logs/ai-logs.module";
import { AuthModule } from "../auth/auth.module";
import { DriversModule } from "../drivers/drivers.module";
import { IncidentsModule } from "../incidents/incidents.module";
import { LoadsModule } from "../loads/loads.module";
import { QueueModule } from "../queue/queue.module";
import { AssistantAiWorkerService } from "./assistant-ai-worker.service";
import { AssistantAuditService } from "./assistant-audit.service";
import { AssistantController } from "./assistant.controller";
import { AssistantJobsController } from "./assistant-jobs.controller";
import { AssistantJobsService } from "./assistant-jobs.service";
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
    QueueModule,
  ],
  controllers: [AssistantController, AssistantJobsController],
  providers: [
    AssistantAiWorkerService,
    AssistantService,
    AssistantJobsService,
    AssistantToolsService,
    AssistantOpenAIClient,
    AssistantAuditService,
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
