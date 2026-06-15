import type { AiLog, AiLogLinkedEntity } from "../types/ai-log.js";
import type { BaseEntity } from "../types/common.js";

export interface CreateAiLogDto {
  operation: string;
  model: string;
  status: AiLog["status"];
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  userId?: string;
  userName: string;
  source: AiLog["source"];
  provider?: string;
  providerRequestId?: string;
  requestInput: string;
  responseOutput?: string;
  errorMessage?: string;
  linkedEntity?: AiLogLinkedEntity;
  completedAt?: string;
}

export interface ListAiLogsQueryDto {
  model?: string;
  operation?: string;
  status?: AiLog["status"];
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export type AiLogListItem = AiLog;

export interface AiLogsListResponse {
  success: true;
  data: AiLogListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type CreateAiLogResponse = {
  success: true;
  data: Omit<AiLog, keyof BaseEntity> & BaseEntity;
};
