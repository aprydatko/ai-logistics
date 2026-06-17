import type {
  AssistantConversationMessage,
  AssistantLinkedEntity,
  AssistantReportType,
  AssistantResultView,
  AssistantResponseStatus,
} from "../types/assistant.js";

export interface AssistantAttachmentDto {
  fileData: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  name: string;
}

export interface AssistantRequestDto {
  message: string;
  model?: string;
  linkedEntity?: AssistantLinkedEntity;
  operation?: string;
  source?: "web" | "mobile" | "api";
  conversationId?: string;
  history?: AssistantConversationMessage[];
  attachment?: AssistantAttachmentDto | null;
}

export interface AssistantResponseDto {
  status: AssistantResponseStatus;
  message: string;
  request?: {
    message: string;
    model: string;
  };
  linkedEntity?: AssistantLinkedEntity;
  usedTools?: string[];
  reportType?: AssistantReportType;
  conversationId?: string;
  resultView?: AssistantResultView;
}
