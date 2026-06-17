import type {
  AssistantConversationMessage,
  AssistantLinkedEntity,
  AssistantReportType,
} from "@repo/shared";

export type AssistantStatus =
  | "idle"
  | "loading"
  | "placeholder"
  | "configured"
  | "error";

export type AssistantApiResponse = {
  conversationId?: string;
  linkedEntity?: AssistantLinkedEntity;
  message: string;
  reportType?: AssistantReportType;
  request?: {
    message: string;
    model: string;
  };
  status?: "placeholder" | "configured" | "error";
  usedTools?: string[];
};

export type AssistantRequestState = {
  answer: string | null;
  detail: string;
  linkedEntity: AssistantLinkedEntity | null;
  reportType: AssistantReportType | null;
  status: AssistantStatus;
  usedTools: string[];
};

export type AssistantMessage = AssistantConversationMessage & {
  attachmentName?: string;
  id: string;
  linkedEntity?: AssistantLinkedEntity | null;
};

export type AssistantAttachment = {
  file: File;
  id: string;
  kind: "image" | "file";
  previewUrl: string | null;
};

export type AssistantSkill = {
  id: "save_document";
  kind: "skill";
  label: "Save document";
};

export type AssistantFilter = { label: string };
