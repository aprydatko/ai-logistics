import type { AiLogsListResponse } from "@repo/shared";

import type { AiLog } from "../ai-logs-data";

export type AiLogFilterOption = {
  label: string;
  value: string;
};

export type AiLogsWorkspaceState = {
  error: string | null;
  isLoading: boolean;
  limit: number;
  logs: AiLog[];
  model: string;
  operation: string;
  page: number;
  pagination: AiLogsListResponse["pagination"] | null;
  selected: AiLog | null;
  status: string;
};
