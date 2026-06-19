import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { rateLimitConfig } from "../../config/rate-limit";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AssistantJobsService } from "./assistant-jobs.service";
import type {
  AssistantJobCreateResponseDto,
  AssistantJobStatusResponseDto,
} from "./dto/assistant-job.dto";
import { CreateAssistantMessageDto } from "./dto/create-assistant-message.dto";

@Controller("assistant/jobs")
@UseGuards(JwtAuthGuard)
export class AssistantJobsController {
  constructor(private readonly assistantJobsService: AssistantJobsService) {}

  @Post()
  @Throttle({ default: rateLimitConfig.assistantJobsCreate })
  create(
    @Body() dto: CreateAssistantMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AssistantJobCreateResponseDto> {
    return this.assistantJobsService.createJob(dto, user);
  }

  @Get(":jobId")
  getStatus(
    @Param("jobId") jobId: string,
  ): Promise<AssistantJobStatusResponseDto> {
    return this.assistantJobsService.getJobStatus(jobId);
  }
}
