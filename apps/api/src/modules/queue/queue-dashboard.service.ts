import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';

import type { Environment } from '../../config/environment';
import {
  AI_PROCESSING_QUEUE_TOKEN,
  DOCUMENT_PROCESSING_QUEUE_TOKEN,
  EMAIL_NOTIFICATIONS_QUEUE_TOKEN,
} from './queue.constants';

/**
 * Wires the Bull Board UI to the three BullMQ queues (AI, document,
 * email) and mounts it under `BULL_BOARD_PATH`. Access control is
 * enforced by {@link QueueDashboardAuthService} at the HTTP boundary;
 * this service is only responsible for assembling the board.
 */
@Injectable()
export class QueueDashboardService implements OnModuleInit {
  readonly basePath: string;
  private readonly serverAdapter = new ExpressAdapter();
  private readonly queues: Queue[];

  constructor(
    configService: ConfigService<Environment, true>,
    @Inject(AI_PROCESSING_QUEUE_TOKEN) aiQueue: Queue,
    @Inject(DOCUMENT_PROCESSING_QUEUE_TOKEN) documentQueue: Queue,
    @Inject(EMAIL_NOTIFICATIONS_QUEUE_TOKEN) emailQueue: Queue
  ) {
    this.basePath = configService.get('BULL_BOARD_PATH', { infer: true });
    this.serverAdapter.setBasePath(this.basePath);
    this.queues = [aiQueue, documentQueue, emailQueue];
  }

  onModuleInit(): void {
    createBullBoard({
      queues: this.queues.map((queue) => new BullMQAdapter(queue)),
      serverAdapter: this.serverAdapter,
    });
  }

  getRouter() {
    return this.serverAdapter.getRouter();
  }
}
