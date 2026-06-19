import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

import type { Environment } from "./config/environment";
import { validateEnvironment } from "./config/environment";
import { getRateLimitConfigFromConfig } from "./config/rate-limit";
import { LoggingModule } from "./common/logging/logging.module";
import { MetricsModule } from "./common/metrics/metrics.module";
import { DatabaseModule } from "./db/database.module";
import { AiLogsModule } from "./modules/ai-logs/ai-logs.module";
import { AssistantModule } from "./modules/assistant/assistant.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthenticatedThrottlerGuard } from "./modules/auth/authenticated-throttler.guard";
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
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Environment, true>) => {
        const rateLimits = getRateLimitConfigFromConfig(configService);

        return [
          {
            ...rateLimits.default,
            name: "default",
          },
        ];
      },
    }),
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticatedThrottlerGuard,
    },
  ],
})
export class AppModule {}
