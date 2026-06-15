import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { and, count, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import { aiLogs } from "../../db/schema";
import type { CreateAiLogDto } from "./dto/create-ai-log.dto";
import type { ListAiLogsQueryDto } from "./dto/list-ai-logs-query.dto";
import type {
  AiLogItem,
  AiLogsListResponse,
  AiLogsMetricsResponse,
  CreateAiLogResponse,
} from "./ai-logs.types";

type MetricBucketKey =
  | "avgLatencyMs"
  | "costUsd"
  | "errors"
  | "requests"
  | "tokens";

type MetricsSourceRow = {
  completedAt: Date | null;
  createdAt: Date;
  estimatedCostUsd: string;
  latencyMs: number;
  status: "failed" | "success";
  totalTokens: number;
};

@Injectable()
export class AiLogsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private readonly loggedAtExpression = sql<Date>`coalesce(${aiLogs.completedAt}, ${aiLogs.createdAt})`;

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

  async findMetrics(query: ListAiLogsQueryDto): Promise<AiLogsMetricsResponse> {
    const filters = this.buildFilters(query);
    const where = filters.length > 0 ? and(...filters) : undefined;
    const rows = await this.databaseService.client
      .select({
        completedAt: aiLogs.completedAt,
        createdAt: aiLogs.createdAt,
        estimatedCostUsd: aiLogs.estimatedCostUsd,
        latencyMs: aiLogs.latencyMs,
        status: aiLogs.status,
        totalTokens: aiLogs.totalTokens,
      })
      .from(aiLogs)
      .where(where);

    const now = new Date();
    const todayStart = this.toStartOfUtcDay(now);
    const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
    const tomorrowStart = new Date(todayStart.getTime() + 86_400_000);
    const sevenDaysAgoStart = new Date(todayStart.getTime() - 6 * 86_400_000);

    const trendMap = new Map<
      string,
      {
        costUsd: number;
        errors: number;
        latencyTotalMs: number;
        requests: number;
        tokens: number;
      }
    >();

    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(sevenDaysAgoStart.getTime() + offset * 86_400_000);
      trendMap.set(this.toUtcDayKey(day), {
        costUsd: 0,
        errors: 0,
        latencyTotalMs: 0,
        requests: 0,
        tokens: 0,
      });
    }

    const totals = {
      costUsd: 0,
      errors: 0,
      latencyTotalMs: 0,
      requests: 0,
      tokens: 0,
    };
    const todayTotals = { ...totals };
    const yesterdayTotals = { ...totals };

    for (const row of rows) {
      const loggedAt = row.completedAt ?? row.createdAt;
      const loggedAtTime = loggedAt.getTime();
      const costUsd = Number(row.estimatedCostUsd);
      const errorCount = row.status === "failed" ? 1 : 0;

      totals.requests += 1;
      totals.latencyTotalMs += row.latencyMs;
      totals.errors += errorCount;
      totals.tokens += row.totalTokens;
      totals.costUsd += costUsd;

      if (
        loggedAtTime >= todayStart.getTime() &&
        loggedAtTime < tomorrowStart.getTime()
      ) {
        todayTotals.requests += 1;
        todayTotals.latencyTotalMs += row.latencyMs;
        todayTotals.errors += errorCount;
        todayTotals.tokens += row.totalTokens;
        todayTotals.costUsd += costUsd;
      } else if (
        loggedAtTime >= yesterdayStart.getTime() &&
        loggedAtTime < todayStart.getTime()
      ) {
        yesterdayTotals.requests += 1;
        yesterdayTotals.latencyTotalMs += row.latencyMs;
        yesterdayTotals.errors += errorCount;
        yesterdayTotals.tokens += row.totalTokens;
        yesterdayTotals.costUsd += costUsd;
      }

      if (
        loggedAtTime >= sevenDaysAgoStart.getTime() &&
        loggedAtTime < tomorrowStart.getTime()
      ) {
        const dayKey = this.toUtcDayKey(loggedAt);
        const bucket = trendMap.get(dayKey);
        if (bucket) {
          bucket.requests += 1;
          bucket.latencyTotalMs += row.latencyMs;
          bucket.errors += errorCount;
          bucket.tokens += row.totalTokens;
          bucket.costUsd += costUsd;
        }
      }
    }

    const trend = Array.from(trendMap.entries()).map(([date, bucket]) => ({
      date,
      requests: bucket.requests,
      avgLatencyMs: bucket.requests
        ? bucket.latencyTotalMs / bucket.requests
        : 0,
      errors: bucket.errors,
      tokens: bucket.tokens,
      costUsd: Number(bucket.costUsd.toFixed(6)),
    }));

    return {
      success: true,
      data: {
        totals: {
          requests: totals.requests,
          avgLatencyMs: totals.requests
            ? totals.latencyTotalMs / totals.requests
            : 0,
          errors: totals.errors,
          tokens: totals.tokens,
          costUsd: Number(totals.costUsd.toFixed(6)),
        },
        changesVsYesterday: {
          requests: this.getPercentChange(
            todayTotals.requests,
            yesterdayTotals.requests,
          ),
          avgLatencyMs: this.getPercentChange(
            todayTotals.requests
              ? todayTotals.latencyTotalMs / todayTotals.requests
              : 0,
            yesterdayTotals.requests
              ? yesterdayTotals.latencyTotalMs / yesterdayTotals.requests
              : 0,
          ),
          errors: this.getPercentChange(
            todayTotals.errors,
            yesterdayTotals.errors,
          ),
          tokens: this.getPercentChange(
            todayTotals.tokens,
            yesterdayTotals.tokens,
          ),
          costUsd: this.getPercentChange(
            todayTotals.costUsd,
            yesterdayTotals.costUsd,
          ),
        },
        trend,
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
    if (query.from) {
      filters.push(gte(this.loggedAtExpression, this.toStartOfDay(query.from)));
    }
    if (query.to) {
      filters.push(lte(this.loggedAtExpression, this.toEndOfDay(query.to)));
    }

    return filters;
  }

  private toStartOfDay(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    return date;
  }

  private toEndOfDay(value: string): Date {
    const date = new Date(`${value}T23:59:59.999Z`);
    return date;
  }

  private getPercentChange(current: number, previous: number): number {
    if (previous === 0) {
      if (current === 0) return 0;
      return 100;
    }

    return ((current - previous) / previous) * 100;
  }

  private toStartOfUtcDay(value: Date): Date {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }

  private toUtcDayKey(value: Date): string {
    return value.toISOString().slice(0, 10);
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
