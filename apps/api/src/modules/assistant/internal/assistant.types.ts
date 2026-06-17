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

export type AssistantResultMetricTone = "amber" | "red" | "teal";

export type AssistantLoadsTableMetric = {
  label: string;
  tone: AssistantResultMetricTone;
  value: string;
};

export type AssistantLoadsTableRow = {
  deliveryDate: string;
  driverCode: string | null;
  driverInitials: string | null;
  driverName: string | null;
  id: string;
  pickupDate: string;
  referenceNumber: string;
  route: string;
  status: string;
};

export type AssistantLoadsTableResult = {
  metrics: AssistantLoadsTableMetric[];
  rows: AssistantLoadsTableRow[];
  summary?: string;
  title: string;
  type: "loads_table";
};

export type AssistantDriversTableRow = {
  driverCode: string;
  id: string;
  isActive: boolean;
  name: string;
  status: "available" | "on_trip" | "off_duty" | "maintenance";
  trailerNumber: string | null;
  truckNumber: string | null;
};

export type AssistantDriversTableResult = {
  metrics: AssistantLoadsTableMetric[];
  rows: AssistantDriversTableRow[];
  summary?: string;
  title: string;
  type: "drivers_table";
};

export type AssistantIncidentsTableRow = {
  driverName: string | null;
  id: string;
  loadReferenceNumber: string;
  occurredAt: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "monitoring" | "resolved" | "closed";
  title: string;
  type: string;
};

export type AssistantIncidentsTableResult = {
  metrics: AssistantLoadsTableMetric[];
  rows: AssistantIncidentsTableRow[];
  summary?: string;
  title: string;
  type: "incidents_table";
};

export type AssistantResultView =
  | AssistantLoadsTableResult
  | AssistantDriversTableResult
  | AssistantIncidentsTableResult;

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

export type LoadSearchOutput = {
  count: number;
  items: Array<{
    deliveryDate: string;
    driver: string | null;
    driverCode: string | null;
    id: string;
    pickupDate: string;
    referenceNumber: string;
    status: string;
    pickupAddress: string;
    deliveryAddress: string;
    miles: number;
  }>;
};

export type DriverSearchOutput = {
  count: number;
  items: Array<{
    driverCode: string;
    firstName: string;
    id: string;
    isActive: boolean;
    lastName: string;
    status: "available" | "on_trip" | "off_duty" | "maintenance";
    trailerNumber: string | null;
    truckNumber: string | null;
  }>;
};

export type IncidentSearchOutput = {
  count: number;
  items: Array<{
    driver: string | null;
    id: string;
    loadReferenceNumber: string;
    occurredAt: string;
    priority: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "monitoring" | "resolved" | "closed";
    title: string;
    type: string;
  }>;
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
export type AssistantResultPayload = AssistantResultView;
