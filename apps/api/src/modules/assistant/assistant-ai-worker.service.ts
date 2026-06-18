import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker, type Job } from "bullmq";

import { WinstonLoggerService } from "../../common/logging/winston-logger.service";
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
    private readonly logger: WinstonLoggerService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      AI_PROCESSING_QUEUE,
      async (job: Job<AssistantQueueJobData, AssistantQueueJobResult>) => {
        this.logger.info("Assistant queue job started", {
          context: AssistantAiWorkerService.name,
          event: "queue_job_started",
          operation: AI_PROCESSING_QUEUE,
          userId: job.data.user.id,
          jobId: job.id,
        });

        return this.assistantService.respond(job.data.dto, job.data.user);
      },
      {
        connection: this.connection,
        concurrency: 2,
      },
    );

    this.worker.on("completed", (job) => {
      this.logger.info("Assistant queue job completed", {
        context: AssistantAiWorkerService.name,
        event: "queue_job_completed",
        operation: AI_PROCESSING_QUEUE,
        userId: job.data.user.id,
        jobId: job.id,
      });
    });

    this.worker.on("failed", (job, error) => {
      this.logger.errorWithMeta("Assistant queue job failed", error, {
        context: AssistantAiWorkerService.name,
        event: "queue_job_failed",
        operation: AI_PROCESSING_QUEUE,
        userId: job?.data.user.id,
        jobId: job?.id,
      });
    });

    this.worker.on("error", (error) => {
      this.logger.errorWithMeta("Assistant worker error", error, {
        context: AssistantAiWorkerService.name,
        event: "queue_worker_error",
        operation: AI_PROCESSING_QUEUE,
      });
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
