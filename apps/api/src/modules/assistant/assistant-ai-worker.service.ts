import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker, type Job } from "bullmq";

import {
  AI_PROCESSING_QUEUE,
  REDIS_CONNECTION,
} from "../queue/queue.constants";
import type {
  AssistantQueueJobData,
  AssistantQueueJobResult,
  RedisConnectionOptions,
} from "../queue/queue.types";
import { AssistantService } from "./assistant.service";

@Injectable()
export class AssistantAiWorkerService implements OnModuleInit, OnModuleDestroy {
  private worker: Worker<
    AssistantQueueJobData,
    AssistantQueueJobResult
  > | null = null;

  constructor(
    @Inject(REDIS_CONNECTION)
    private readonly connection: RedisConnectionOptions,
    private readonly assistantService: AssistantService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      AI_PROCESSING_QUEUE,
      async (job: Job<AssistantQueueJobData, AssistantQueueJobResult>) =>
        this.assistantService.respond(job.data.dto, job.data.user),
      {
        connection: this.connection,
        concurrency: 2,
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
