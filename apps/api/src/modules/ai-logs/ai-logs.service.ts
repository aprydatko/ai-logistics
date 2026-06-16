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

@Injectable()
export class AiLogsService {
  private readonly MILLISECONDS_PER_DAY = 86_400_000;
  private readonly DEFAULT_TREND_DAYS = 7;

  constructor(private readonly databaseService: DatabaseService) {}

  private readonly loggedAtExpression = sql<Date>`coalesce(${aiLogs.completedAt}, ${aiLogs.createdAt})`;

  /**
   * Returns a paginated, filtered list of AI log entries.
   *
   * Executes data and count queries in parallel using `Promise.all`.
   * Logs are ordered by creation date descending.
   * Supported filters: `model`, `operation`, `status`, `from` (date range start),
   * `to` (date range end). Date filters use the `completedAt` timestamp
   * when available, otherwise fall back to `createdAt`.
   *
   * @param query - Pagination and filter parameters
   * @returns Paginated AI log list with page metadata
   */
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

  /**
   * Calculates and returns AI usage metrics with trend analysis.
   *
   * Fetches all matching log entries and aggregates metrics into three categories:
   * 1. **Totals**: Overall metrics across all filtered records (requests, avg latency,
   *    errors, tokens, cost)
   * 2. **Changes vs Yesterday**: Percentage change comparing today vs yesterday
   * 3. **Trend**: Daily breakdown for the last 7 days (configurable via DEFAULT_TREND_DAYS)
   *
   * Uses `completedAt` timestamp when available, otherwise falls back to `createdAt`.
   * Date boundaries are calculated in UTC to ensure consistent day boundaries across
   * timezones. Cost values are rounded to 6 decimal places for precision.
   *
   * @param query - Filter parameters (same as findAll)
   * @returns Metrics with totals, day-over-day changes, and trend
   */
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
    const yesterdayStart = new Date(
      todayStart.getTime() - this.MILLISECONDS_PER_DAY,
    );
    const tomorrowStart = new Date(
      todayStart.getTime() + this.MILLISECONDS_PER_DAY,
    );
    const trendDaysAgoStart = new Date(
      todayStart.getTime() -
        (this.DEFAULT_TREND_DAYS - 1) * this.MILLISECONDS_PER_DAY,
    );

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

    for (let offset = 0; offset < this.DEFAULT_TREND_DAYS; offset += 1) {
      const day = new Date(
        trendDaysAgoStart.getTime() + offset * this.MILLISECONDS_PER_DAY,
      );
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
        loggedAtTime >= trendDaysAgoStart.getTime() &&
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

  /**
   * Creates a new AI log entry.
   *
   * Records an AI API call with operation details, token usage, cost, latency,
   * and optional request/response payloads. Defaults missing optional fields:
   * - Token counts default to 0
   * - Cost defaults to 0
   * - Provider defaults to "openai"
   * - completedAt defaults to current timestamp if not provided
   *
   * @param dto - AI log creation payload
   * @returns Created AI log entry
   * @throws InternalServerErrorException if database insert fails
   */
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

  /**
   * Builds an array of Drizzle SQL filter conditions from query parameters.
   *
   * Supports filtering by model, operation, status, and date range.
   * Date filters use the `loggedAtExpression` which prefers `completedAt`
   * over `createdAt` for more accurate time-based filtering.
   *
   * @param query - Query parameters from ListAiLogsQueryDto
   * @returns Array of SQL filter conditions (empty if no filters provided)
   */
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
      filters.push(
        gte(
          this.loggedAtExpression,
          this.toStartOfUtcDayFromString(query.from),
        ),
      );
    }
    if (query.to) {
      filters.push(
        lte(this.loggedAtExpression, this.toEndOfUtcDayFromString(query.to)),
      );
    }

    return filters;
  }

  /**
   * Converts a date string to the start of that day in UTC.
   *
   * @param value - Date string in YYYY-MM-DD format
   * @returns Date object set to 00:00:00.000 UTC
   */
  private toStartOfUtcDayFromString(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    return date;
  }

  /**
   * Converts a date string to the end of that day in UTC.
   *
   * @param value - Date string in YYYY-MM-DD format
   * @returns Date object set to 23:59:59.999 UTC
   */
  private toEndOfUtcDayFromString(value: string): Date {
    const date = new Date(`${value}T23:59:59.999Z`);
    return date;
  }

  /**
   * Calculates the percentage change between two values.
   *
   * Handles edge cases:
   * - If both current and previous are 0, returns 0 (no change)
   * - If previous is 0 but current is not, returns 100 (infinite growth)
   * - Otherwise calculates ((current - previous) / previous) * 100
   *
   * @param current - Current value
   * @param previous - Previous value to compare against
   * @returns Percentage change (can be negative for decreases)
   */
  private getPercentChange(current: number, previous: number): number {
    if (previous === 0) {
      if (current === 0) return 0;
      return 100;
    }

    return ((current - previous) / previous) * 100;
  }

  /**
   * Converts a Date to the start of its day in UTC.
   *
   * Extracts the UTC year, month, and day from the input date
   * and creates a new Date object set to midnight UTC.
   *
   * @param value - Input date
   * @returns Date object set to 00:00:00.000 UTC of the same day
   */
  private toStartOfUtcDay(value: Date): Date {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }

  /**
   * Converts a Date to a UTC day key string.
   *
   * Returns the ISO date string (YYYY-MM-DD) which can be used
   * as a map key for grouping metrics by day.
   *
   * @param value - Input date
   * @returns UTC day key in YYYY-MM-DD format
   */
  private toUtcDayKey(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  /**
   * Transforms a database AiLogRecord into an API AiLogItem response.
   *
   * Converts Date fields to ISO strings and converts estimatedCostUsd
   * from string to number. Handles null completedAt gracefully.
   *
   * @param row - Database AI log record
   * @returns API-ready AI log item with serialized dates
   */
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
