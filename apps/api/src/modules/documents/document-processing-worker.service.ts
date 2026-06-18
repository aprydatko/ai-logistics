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
  DOCUMENT_PROCESSING_QUEUE,
  REDIS_CONNECTION,
} from "../queue/queue.constants";
import type {
  DocumentProcessingJobData,
  RedisConnectionOptions,
} from "../queue/queue.types";
import { DocumentsService } from "./documents.service";

@Injectable()
export class DocumentProcessingWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private worker: Worker<DocumentProcessingJobData> | null = null;

  constructor(
    @Inject(REDIS_CONNECTION)
    private readonly connection: RedisConnectionOptions,
    private readonly documentsService: DocumentsService,
    private readonly logger: WinstonLoggerService,
    private readonly sentry: SentryService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      DOCUMENT_PROCESSING_QUEUE,
      async (job: Job<DocumentProcessingJobData>) => {
        this.logger.info("Document processing job started", {
          context: DocumentProcessingWorkerService.name,
          event: "queue_job_started",
          operation: DOCUMENT_PROCESSING_QUEUE,
          linkedEntity: job.data.documentId,
          jobId: job.id,
        });

        return this.documentsService.processQueuedAnalysis(job.data.documentId);
      },
      {
        connection: this.connection,
        concurrency: 2,
      },
    );

    this.worker.on("completed", (job) => {
      this.logger.info("Document processing job completed", {
        context: DocumentProcessingWorkerService.name,
        event: "queue_job_completed",
        operation: DOCUMENT_PROCESSING_QUEUE,
        linkedEntity: job.data.documentId,
        jobId: job.id,
      });
    });

    this.worker.on("failed", (job, error) => {
      this.logger.errorWithMeta("Document processing job failed", error, {
        context: DocumentProcessingWorkerService.name,
        event: "queue_job_failed",
        operation: DOCUMENT_PROCESSING_QUEUE,
        linkedEntity: job?.data.documentId,
        jobId: job?.id,
      });
      this.sentry.captureException(error, {
        extra: {
          documentId: job?.data.documentId,
          jobId: job?.id,
          operation: DOCUMENT_PROCESSING_QUEUE,
        },
        tags: {
          area: "queue",
          event: "queue_job_failed",
          operation: DOCUMENT_PROCESSING_QUEUE,
        },
      });
    });

    this.worker.on("error", (error) => {
      this.logger.errorWithMeta("Document processing worker error", error, {
        context: DocumentProcessingWorkerService.name,
        event: "queue_worker_error",
        operation: DOCUMENT_PROCESSING_QUEUE,
      });
      this.sentry.captureException(error, {
        tags: {
          area: "queue",
          event: "queue_worker_error",
          operation: DOCUMENT_PROCESSING_QUEUE,
        },
      });
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
