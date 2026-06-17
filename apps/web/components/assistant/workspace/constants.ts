import type { AssistantFilter, AssistantStatus } from "./types";

export const initialAssistantModel = "gpt-4.1-mini";

export const initialFilters: AssistantFilter[] = [
  { label: "Date: May 24 – May 28" },
  { label: "Status: Delayed, Open" },
  { label: "Region: Midwest" },
];

export const initialAssistantState = {
  answer: null,
  detail: "Checking OpenAI setup...",
  linkedEntity: null,
  reportType: null,
  resultView: null,
  status: "loading",
  usedTools: [],
} as const satisfies {
  answer: null;
  detail: string;
  linkedEntity: null;
  reportType: null;
  resultView: null;
  status: AssistantStatus;
  usedTools: [];
};

export const statusClasses: Record<AssistantStatus, string> = {
  configured: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  idle: "border-border bg-surface-50 text-primary-800",
  loading: "border-blue-200 bg-blue-50 text-blue-900",
  placeholder: "border-amber-200 bg-amber-50 text-amber-900",
};

export const statusLabel: Record<AssistantStatus, string> = {
  configured: "Configured",
  error: "Unavailable",
  idle: "Waiting",
  loading: "Checking setup",
  placeholder: "Placeholder mode",
};
