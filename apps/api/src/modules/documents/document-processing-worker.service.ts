import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker, type Job } from "bullmq";

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
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      DOCUMENT_PROCESSING_QUEUE,
      async (job: Job<DocumentProcessingJobData>) =>
        this.documentsService.processQueuedAnalysis(job.data.documentId),
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
