import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { and, count, desc, eq, type SQL } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import { aiLogs } from "../../db/schema";
import type { CreateAiLogDto } from "./dto/create-ai-log.dto";
import type { ListAiLogsQueryDto } from "./dto/list-ai-logs-query.dto";
import type {
  AiLogItem,
  AiLogsListResponse,
  CreateAiLogResponse,
} from "./ai-logs.types";

@Injectable()
export class AiLogsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query: ListAiLogsQueryDto): Promise<AiLogsListResponse> {
    const filters = this.buildFilters(query);
    const where = filters.length > 0 ? and(...filters) : undefined;
    const [rows, countRows] = await Promise.all([
      this.databaseService.client
        .select()
        .from(aiLogs)
        .where(where)
        .orderBy(desc(aiLogs.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.databaseService.client
        .select({ total: count() })
        .from(aiLogs)
        .where(where),
    ]);
    const total = countRows[0]?.total ?? 0;

    return {
      success: true,
      data: rows.map((row) => this.toAiLogItem(row)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async create(dto: CreateAiLogDto): Promise<CreateAiLogResponse> {
    const [row] = await this.databaseService.client
      .insert(aiLogs)
      .values({
        operation: dto.operation,
        model: dto.model,
        status: dto.status,
        latencyMs: dto.latencyMs,
        promptTokens: dto.promptTokens ?? 0,
        completionTokens: dto.completionTokens ?? 0,
        totalTokens: dto.totalTokens ?? 0,
        estimatedCostUsd: String(dto.estimatedCostUsd ?? 0),
        userId: dto.userId,
        userName: dto.userName,
        source: dto.source,
        provider: dto.provider ?? "openai",
        providerRequestId: dto.providerRequestId,
        requestInput: dto.requestInput,
        responseOutput: dto.responseOutput,
        errorMessage: dto.errorMessage,
        linkedEntity: dto.linkedEntity,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!row) {
      throw new InternalServerErrorException("Failed to create AI log");
    }

    return {
      success: true,
      data: this.toAiLogItem(row),
    };
  }

  private buildFilters(query: ListAiLogsQueryDto): SQL[] {
    const filters: SQL[] = [];

    if (query.model) {
      filters.push(eq(aiLogs.model, query.model));
    }
    if (query.operation) {
      filters.push(eq(aiLogs.operation, query.operation));
    }
    if (query.status) {
      filters.push(eq(aiLogs.status, query.status));
    }

    return filters;
  }

  private toAiLogItem(row: typeof aiLogs.$inferSelect): AiLogItem {
    return {
      ...row,
      estimatedCostUsd: Number(row.estimatedCostUsd),
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
