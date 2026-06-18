import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker, type Job } from "bullmq";

import { SentryService } from "../../common/logging/sentry.service";
import { WinstonLoggerService } from "../../common/logging/winston-logger.service";
import {
  EMAIL_NOTIFICATIONS_QUEUE,
  REDIS_CONNECTION,
} from "../queue/queue.constants";
import type {
  EmailNotificationJobData,
  RedisConnectionOptions,
} from "../queue/queue.types";
import { NotificationsDeliveryService } from "./notifications-delivery.service";

@Injectable()
export class NotificationsEmailWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private worker: Worker<EmailNotificationJobData> | null = null;

  constructor(
    @Inject(REDIS_CONNECTION)
    private readonly connection: RedisConnectionOptions,
    private readonly notificationsDeliveryService: NotificationsDeliveryService,
    private readonly logger: WinstonLoggerService,
    private readonly sentry: SentryService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      EMAIL_NOTIFICATIONS_QUEUE,
      async (job: Job<EmailNotificationJobData>) => {
        this.logger.debugWithMeta("Processing email notification job", {
          context: NotificationsEmailWorkerService.name,
          event: "queue_job_started",
          operation: EMAIL_NOTIFICATIONS_QUEUE,
          userId: job.data.recipient.id,
          jobId: job.id,
        });
        await this.notificationsDeliveryService.sendNotificationEmail(job.data);
      },
      {
        connection: this.connection,
        concurrency: 5,
      },
    );

    this.worker.on("completed", (job) => {
      this.logger.info("Email notification job completed", {
        context: NotificationsEmailWorkerService.name,
        event: "queue_job_completed",
        operation: EMAIL_NOTIFICATIONS_QUEUE,
        userId: job.data.recipient.id,
        jobId: job.id,
      });
    });

    this.worker.on("failed", (job, error) => {
      this.logger.errorWithMeta("Email notification job failed", error, {
        context: NotificationsEmailWorkerService.name,
        event: "queue_job_failed",
        operation: EMAIL_NOTIFICATIONS_QUEUE,
        userId: job?.data.recipient.id,
        jobId: job?.id,
      });
      this.sentry.captureException(error, {
        extra: {
          jobId: job?.id,
          operation: EMAIL_NOTIFICATIONS_QUEUE,
        },
        tags: {
          area: "queue",
          event: "queue_job_failed",
          operation: EMAIL_NOTIFICATIONS_QUEUE,
        },
        user: job?.data.recipient.id
          ? {
              email: job.data.recipient.email,
              id: job.data.recipient.id,
              username: job.data.recipient.email,
            }
          : undefined,
      });
    });

    this.worker.on("error", (error) => {
      this.logger.errorWithMeta("Email worker error", error, {
        context: NotificationsEmailWorkerService.name,
        event: "queue_worker_error",
        operation: EMAIL_NOTIFICATIONS_QUEUE,
      });
      this.sentry.captureException(error, {
        tags: {
          area: "queue",
          event: "queue_worker_error",
          operation: EMAIL_NOTIFICATIONS_QUEUE,
        },
      });
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
