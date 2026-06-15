export type AssistantStatus =
  | "idle"
  | "loading"
  | "placeholder"
  | "configured"
  | "error";

export type AssistantApiResponse = {
  message: string;
  model?: string;
  request?: {
    message: string;
    model: string;
  };
  status?: "placeholder" | "configured" | "error";
};

export type AssistantRequestState = {
  answer: string | null;
  detail: string;
  status: AssistantStatus;
};

export type AssistantFilter = {
  label: string;
};
