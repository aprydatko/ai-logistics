import type { DriverDetailsResponse } from "../../drivers/drivers.types";
import type { IncidentResponse } from "../../incidents/incidents.types";

export type AssistantLinkedEntity = {
  type: "load" | "driver" | "incident";
  recordId: string;
  title: string;
  route?: string;
};

export type AssistantReportType =
  | "loads"
  | "drivers"
  | "incidents"
  | "operations"
  | "general";

export type CreateAiLogDto = {
  completionTokens?: number;
  errorMessage?: string;
  estimatedCostUsd?: number;
  latencyMs: number;
  linkedEntity?: AssistantLinkedEntity;
  model: string;
  operation: string;
  promptTokens?: number;
  providerRequestId?: string;
  requestInput: string;
  responseOutput?: string;
  source: "web" | "mobile" | "api";
  status: "success" | "failed";
  totalTokens?: number;
  userId?: string;
  userName: string;
};

export type ToolResult = {
  linkedEntity?: AssistantLinkedEntity;
  output: Record<string, unknown>;
};

export type AssistantToolName =
  | "search_loads"
  | "search_drivers"
  | "search_incidents"
  | "get_load_details"
  | "get_driver_details"
  | "get_incident_details"
  | "generate_incident_guidance";

export type ToolCall = {
  arguments: string;
  callId: string;
  name: AssistantToolName;
};

export type OpenAIResponseUsage = {
  output_tokens?: number;
  input_tokens?: number;
  total_tokens?: number;
};

export type OpenAIResponseBody = {
  error?: {
    message?: string;
  };
  id?: string;
  output?: Array<Record<string, unknown>>;
  output_text?: string;
  usage?: OpenAIResponseUsage;
};

export type IncidentEscalation = "monitor" | "ops_manager" | "urgent";

export type DriverDetailsSummaryInput = DriverDetailsResponse;
export type IncidentDetailsInput = IncidentResponse["data"];
