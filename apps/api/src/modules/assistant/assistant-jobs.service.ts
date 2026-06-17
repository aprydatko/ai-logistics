import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Queue } from "bullmq";

import type { AuthenticatedUser } from "../auth/auth.types";
import { AI_PROCESSING_QUEUE_TOKEN } from "../queue/queue.constants";
import type {
  AssistantQueueJobData,
  AssistantQueueJobResult,
} from "../queue/queue.types";
import type {
  AssistantJobCreateResponseDto,
  AssistantJobStatusResponseDto,
} from "./dto/assistant-job.dto";
import type { CreateAssistantMessageDto } from "./dto/create-assistant-message.dto";

@Injectable()
export class AssistantJobsService {
  constructor(
    @Inject(AI_PROCESSING_QUEUE_TOKEN)
    private readonly aiProcessingQueue: Queue<
      AssistantQueueJobData,
      AssistantQueueJobResult
    >,
  ) {}

  async createJob(
    dto: CreateAssistantMessageDto,
    user: AuthenticatedUser,
  ): Promise<AssistantJobCreateResponseDto> {
    const job = await this.aiProcessingQueue.add(
      "process-assistant-request",
      { dto, user },
      {
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 1_000,
        },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    );

    return {
      success: true,
      data: {
        jobId: job.id!,
        status: "queued",
      },
    };
  }

  async getJobStatus(jobId: string): Promise<AssistantJobStatusResponseDto> {
    const job = await this.aiProcessingQueue.getJob(jobId);
    if (!job) throw new NotFoundException("Assistant job was not found");

    const state = await job.getState();
    return {
      success: true,
      data: {
        jobId,
        status: state,
        ...(job.failedReason ? { error: job.failedReason } : {}),
        ...(job.returnvalue ? { result: job.returnvalue } : {}),
      },
    };
  }
}
