import type { CursorPageInfo } from "@repo/shared/src";
import type { AiLogRecord } from "../../db/schema";

export type AiLogItem = Omit<
  AiLogRecord,
  "completedAt" | "createdAt" | "estimatedCostUsd" | "updatedAt"
> & {
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  estimatedCostUsd: number;
};

export type AiLogsListResponse = {
  success: true;
  data: AiLogItem[];
  pageInfo: CursorPageInfo;
};

export type AiLogsMetricsResponse = {
  success: true;
  data: {
    totals: {
      requests: number;
      avgLatencyMs: number;
      errors: number;
      tokens: number;
      costUsd: number;
    };
    changesVsYesterday: {
      requests: number;
      avgLatencyMs: number;
      errors: number;
      tokens: number;
      costUsd: number;
    };
    trend: Array<{
      date: string;
      requests: number;
      avgLatencyMs: number;
      errors: number;
      tokens: number;
      costUsd: number;
    }>;
  };
};

export type CreateAiLogResponse = {
  success: true;
  data: AiLogItem;
};
