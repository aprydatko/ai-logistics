import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AiLogsService } from "./ai-logs.service";
import { CreateAiLogDto } from "./dto/create-ai-log.dto";
import { ListAiLogsQueryDto } from "./dto/list-ai-logs-query.dto";
import type {
  AiLogsListResponse,
  AiLogsMetricsResponse,
  CreateAiLogResponse,
} from "./ai-logs.types";

@Controller("ai-logs")
@UseGuards(JwtAuthGuard)
export class AiLogsController {
  constructor(private readonly aiLogsService: AiLogsService) {}

  @Get()
  findAll(@Query() query: ListAiLogsQueryDto): Promise<AiLogsListResponse> {
    return this.aiLogsService.findAll(query);
  }

  @Get("metrics")
  findMetrics(
    @Query() query: ListAiLogsQueryDto,
  ): Promise<AiLogsMetricsResponse> {
    return this.aiLogsService.findMetrics(query);
  }

  @Post()
  create(@Body() dto: CreateAiLogDto): Promise<CreateAiLogResponse> {
    return this.aiLogsService.create(dto);
  }
}
