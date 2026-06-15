import type { BaseEntity, ISODateString } from "./common.js";

export type AiLogStatus = "success" | "failed";

export type AiLogSource = "web" | "mobile" | "api";

export interface AiLogLinkedEntity {
  type: string;
  recordId: string;
  title: string;
  route?: string;
}

export interface AiLog extends BaseEntity {
  operation: string;
  model: string;
  status: AiLogStatus;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  userId?: string;
  userName: string;
  source: AiLogSource;
  provider: string;
  providerRequestId?: string;
  requestInput: string;
  responseOutput?: string;
  errorMessage?: string;
  linkedEntity?: AiLogLinkedEntity;
  completedAt?: ISODateString;
}
