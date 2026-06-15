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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateAiLogResponse = {
  success: true;
  data: AiLogItem;
};
