import { Inject, Injectable } from "@nestjs/common";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import type { Queue } from "bullmq";
import { ConfigService } from "@nestjs/config";

import type { Environment } from "../../config/environment";
import {
  AI_PROCESSING_QUEUE_TOKEN,
  DOCUMENT_PROCESSING_QUEUE_TOKEN,
  EMAIL_NOTIFICATIONS_QUEUE_TOKEN,
} from "./queue.constants";

@Injectable()
export class QueueDashboardService {
  readonly basePath: string;
  private readonly serverAdapter = new ExpressAdapter();

  constructor(
    configService: ConfigService<Environment, true>,
    @Inject(AI_PROCESSING_QUEUE_TOKEN) aiQueue: Queue,
    @Inject(DOCUMENT_PROCESSING_QUEUE_TOKEN) documentQueue: Queue,
    @Inject(EMAIL_NOTIFICATIONS_QUEUE_TOKEN) emailQueue: Queue,
  ) {
    this.basePath = configService.get("BULL_BOARD_PATH", { infer: true });
    this.serverAdapter.setBasePath(this.basePath);

    createBullBoard({
      queues: [
        new BullMQAdapter(aiQueue),
        new BullMQAdapter(documentQueue),
        new BullMQAdapter(emailQueue),
      ],
      serverAdapter: this.serverAdapter,
    });
  }

  getRouter() {
    return this.serverAdapter.getRouter();
  }
}
