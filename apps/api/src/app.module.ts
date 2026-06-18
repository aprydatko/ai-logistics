import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, minutes } from "@nestjs/throttler";

import { validateEnvironment } from "./config/environment";
import { LoggingModule } from "./common/logging/logging.module";
import { MetricsModule } from "./common/metrics/metrics.module";
import { DatabaseModule } from "./db/database.module";
import { AiLogsModule } from "./modules/ai-logs/ai-logs.module";
import { AssistantModule } from "./modules/assistant/assistant.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { DriversModule } from "./modules/drivers/drivers.module";
import { HealthModule } from "./modules/health/health.module";
import { IncidentsModule } from "./modules/incidents/incidents.module";
import { LoadsModule } from "./modules/loads/loads.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { QueueModule } from "./modules/queue/queue.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    LoggingModule,
    MetricsModule,
    ThrottlerModule.forRoot([
      {
        limit: 60,
        name: "default",
        ttl: minutes(1),
      },
    ]),
    DatabaseModule,
    QueueModule,
    AiLogsModule,
    AssistantModule,
    AuthModule,
    DocumentsModule,
    DriversModule,
    LoadsModule,
    IncidentsModule,
    NotificationsModule,
    HealthModule,
  ],
})
export class AppModule {}
