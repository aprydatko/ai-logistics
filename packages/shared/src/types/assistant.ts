export interface AssistantLinkedEntity {
  type: "load" | "driver" | "incident";
  recordId: string;
  title: string;
  route?: string;
}

export type AssistantMessageRole = "user" | "assistant";

export interface AssistantConversationMessage {
  role: AssistantMessageRole;
  text: string;
}

export type AssistantReportType =
  | "loads"
  | "drivers"
  | "incidents"
  | "operations"
  | "general";

export type AssistantResponseStatus = "placeholder" | "configured" | "error";

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

export type AssistantResultView = AssistantLoadsTableResult;
