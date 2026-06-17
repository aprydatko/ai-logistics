import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";

import type { Environment } from "../../config/environment";
import { AuthModule } from "../auth/auth.module";
import {
  AI_PROCESSING_QUEUE,
  AI_PROCESSING_QUEUE_TOKEN,
  DOCUMENT_PROCESSING_QUEUE,
  DOCUMENT_PROCESSING_QUEUE_TOKEN,
  EMAIL_NOTIFICATIONS_QUEUE,
  EMAIL_NOTIFICATIONS_QUEUE_TOKEN,
  REDIS_CONNECTION,
} from "./queue.constants";
import { QueueDashboardAuthService } from "./queue-dashboard-auth.service";
import { QueueDashboardService } from "./queue-dashboard.service";
import type { RedisConnectionOptions } from "./queue.types";

@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: REDIS_CONNECTION,
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<Environment, true>,
      ): RedisConnectionOptions => {
        const redisUrl = new URL(
          configService.get("REDIS_URL", { infer: true }),
        );

        return {
          db: redisUrl.pathname ? Number(redisUrl.pathname.slice(1) || "0") : 0,
          host: redisUrl.hostname,
          maxRetriesPerRequest: null,
          password: redisUrl.password || undefined,
          port: Number(redisUrl.port || "6379"),
          username: redisUrl.username || undefined,
        };
      },
    },
    {
      provide: AI_PROCESSING_QUEUE_TOKEN,
      inject: [REDIS_CONNECTION],
      useFactory: (connection: RedisConnectionOptions) =>
        new Queue(AI_PROCESSING_QUEUE, { connection }),
    },
    {
      provide: DOCUMENT_PROCESSING_QUEUE_TOKEN,
      inject: [REDIS_CONNECTION],
      useFactory: (connection: RedisConnectionOptions) =>
        new Queue(DOCUMENT_PROCESSING_QUEUE, { connection }),
    },
    {
      provide: EMAIL_NOTIFICATIONS_QUEUE_TOKEN,
      inject: [REDIS_CONNECTION],
      useFactory: (connection: RedisConnectionOptions) =>
        new Queue(EMAIL_NOTIFICATIONS_QUEUE, { connection }),
    },
    QueueDashboardAuthService,
    QueueDashboardService,
  ],
  exports: [
    REDIS_CONNECTION,
    AI_PROCESSING_QUEUE_TOKEN,
    DOCUMENT_PROCESSING_QUEUE_TOKEN,
    EMAIL_NOTIFICATIONS_QUEUE_TOKEN,
    QueueDashboardAuthService,
    QueueDashboardService,
  ],
})
export class QueueModule {}
