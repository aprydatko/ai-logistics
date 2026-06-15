import type { AiLogsListResponse } from "@repo/shared";

export type AiLogStatus = "Failed" | "Success";

export type AiLog = {
  id: string;
  time: string;
  model: string;
  operation: string;
  status: AiLogStatus;
  latency: string;
  tokens: string;
  tokenDetail: string;
  cost: string;
  user: string;
  initials: string;
  source: "Mobile" | "Web" | "API";
  linkedType: string;
  linkedId: string;
  linkedTitle: string;
  route?: string;
  prompt: string;
  response: string;
};

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    second: "2-digit",
  }).format(new Date(value));

const formatLatency = (latencyMs: number): string =>
  `${(latencyMs / 1000).toFixed(2)}s`;

const formatTokens = (value: number): string =>
  new Intl.NumberFormat("en-US").format(value);

const formatCost = (value: number): string => `$${value.toFixed(3)}`;

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

const toSourceLabel = (source: string): AiLog["source"] => {
  if (source === "mobile") return "Mobile";
  if (source === "api") return "API";
  return "Web";
};

export const mapAiLogListResponse = (response: AiLogsListResponse): AiLog[] =>
  response.data.map((log) => ({
    id: log.id,
    time: formatDate(log.completedAt ?? log.createdAt),
    model: log.model,
    operation: log.operation,
    status: log.status === "success" ? "Success" : "Failed",
    latency: formatLatency(log.latencyMs),
    tokens: formatTokens(log.totalTokens),
    tokenDetail: `${formatTokens(log.promptTokens)} prompt / ${formatTokens(log.completionTokens)} completion`,
    cost: formatCost(log.estimatedCostUsd),
    user: log.userName,
    initials: getInitials(log.userName),
    source: toSourceLabel(log.source),
    linkedType: log.linkedEntity?.type ?? "Not linked",
    linkedId: log.linkedEntity?.recordId ?? "—",
    linkedTitle: log.linkedEntity?.title ?? "—",
    route: log.linkedEntity?.route,
    prompt: log.requestInput,
    response: log.responseOutput ?? log.errorMessage ?? "No response captured.",
  }));

export const metricData = [
  {
    title: "AI Requests",
    value: "Live data soon",
    change: "0%",
    direction: "up",
    favorable: true,
    color: "#0891b2",
    data: [10, 12, 11, 15, 14, 16, 13, 18],
  },
  {
    title: "Avg Latency",
    value: "From logs",
    change: "0%",
    direction: "down",
    favorable: true,
    color: "#0f766e",
    data: [18, 16, 14, 17, 13, 15, 12, 10],
  },
  {
    title: "Errors",
    value: "Tracked",
    change: "0%",
    direction: "up",
    favorable: false,
    color: "#dc2626",
    data: [3, 4, 2, 5, 4, 3, 2, 4],
  },
  {
    title: "Tokens Used",
    value: "Tracked",
    change: "0%",
    direction: "up",
    favorable: false,
    color: "#5b5fc7",
    data: [12, 10, 14, 16, 13, 17, 18, 20],
  },
  {
    title: "Estimated Cost",
    value: "Tracked",
    change: "0%",
    direction: "up",
    favorable: false,
    color: "#d97706",
    data: [9, 8, 10, 12, 11, 13, 12, 14],
  },
] as const;
