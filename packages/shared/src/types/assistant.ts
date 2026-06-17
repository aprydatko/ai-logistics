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
