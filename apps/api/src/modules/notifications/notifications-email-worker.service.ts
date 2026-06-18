import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker, type Job } from "bullmq";

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
  private readonly logger = new Logger(NotificationsEmailWorkerService.name);

  constructor(
    @Inject(REDIS_CONNECTION)
    private readonly connection: RedisConnectionOptions,
    private readonly notificationsDeliveryService: NotificationsDeliveryService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      EMAIL_NOTIFICATIONS_QUEUE,
      async (job: Job<EmailNotificationJobData>) => {
        this.logger.debug(
          `Processing email job ${job.id} for ${job.data.recipient.email}`,
        );
        await this.notificationsDeliveryService.sendNotificationEmail(job.data);
      },
      {
        connection: this.connection,
        concurrency: 5,
      },
    );

    this.worker.on("completed", (job) => {
      this.logger.debug(`Email job ${job.id} completed successfully`);
    });

    this.worker.on("failed", (job, error) => {
      this.logger.error(`Email job ${job?.id} failed`, error);
    });

    this.worker.on("error", (error) => {
      this.logger.error("Email worker error", error);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
