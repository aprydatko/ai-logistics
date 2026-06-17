import {
  Inject,
  Injectable,
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

  constructor(
    @Inject(REDIS_CONNECTION)
    private readonly connection: RedisConnectionOptions,
    private readonly notificationsDeliveryService: NotificationsDeliveryService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      EMAIL_NOTIFICATIONS_QUEUE,
      async (job: Job<EmailNotificationJobData>) =>
        this.notificationsDeliveryService.sendNotificationEmail(job.data),
      {
        connection: this.connection,
        concurrency: 5,
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
