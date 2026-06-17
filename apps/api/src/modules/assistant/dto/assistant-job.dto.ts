import type { AssistantResponseDto } from "./create-assistant-message.dto";

export type AssistantJobCreateResponseDto = {
  success: true;
  data: {
    jobId: string;
    status: "queued";
  };
};

export type AssistantJobStatus =
  | "active"
  | "completed"
  | "delayed"
  | "failed"
  | "paused"
  | "prioritized"
  | "unknown"
  | "waiting"
  | "waiting-children";

export type AssistantJobStatusResponseDto = {
  success: true;
  data: {
    error?: string;
    jobId: string;
    result?: AssistantResponseDto;
    status: AssistantJobStatus;
  };
};
