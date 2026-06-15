import type { AiLogsListResponse, AiLogsMetricsResponse } from "@repo/shared";

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

export type AiLogMetricCard = {
  change: string;
  color: string;
  data: number[];
  direction: "down" | "up";
  favorable: boolean;
  title: string;
  value: string;
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

const formatCompactNumber = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);

const formatChange = (value: number): string =>
  `${Math.abs(value).toFixed(1).replace(/\.0$/, "")}%`;

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

export const mapAiLogMetricsResponse = (
  response: AiLogsMetricsResponse,
): AiLogMetricCard[] => {
  const { changesVsYesterday, totals, trend } = response.data;

  return [
    {
      title: "AI Requests",
      value: formatCompactNumber(totals.requests),
      change: formatChange(changesVsYesterday.requests),
      direction: changesVsYesterday.requests >= 0 ? "up" : "down",
      favorable: changesVsYesterday.requests >= 0,
      color: "#0891b2",
      data: trend.map((point) => point.requests),
    },
    {
      title: "Avg Latency",
      value: formatLatency(totals.avgLatencyMs),
      change: formatChange(changesVsYesterday.avgLatencyMs),
      direction: changesVsYesterday.avgLatencyMs >= 0 ? "up" : "down",
      favorable: changesVsYesterday.avgLatencyMs <= 0,
      color: "#0f766e",
      data: trend.map((point) => Math.round(point.avgLatencyMs)),
    },
    {
      title: "Errors",
      value: formatCompactNumber(totals.errors),
      change: formatChange(changesVsYesterday.errors),
      direction: changesVsYesterday.errors >= 0 ? "up" : "down",
      favorable: changesVsYesterday.errors <= 0,
      color: "#dc2626",
      data: trend.map((point) => point.errors),
    },
    {
      title: "Tokens Used",
      value: formatCompactNumber(totals.tokens),
      change: formatChange(changesVsYesterday.tokens),
      direction: changesVsYesterday.tokens >= 0 ? "up" : "down",
      favorable: changesVsYesterday.tokens >= 0,
      color: "#5b5fc7",
      data: trend.map((point) => point.tokens),
    },
    {
      title: "Estimated Cost",
      value: formatCost(totals.costUsd),
      change: formatChange(changesVsYesterday.costUsd),
      direction: changesVsYesterday.costUsd >= 0 ? "up" : "down",
      favorable: changesVsYesterday.costUsd <= 0,
      color: "#d97706",
      data: trend.map((point) => Number(point.costUsd.toFixed(3))),
    },
  ];
};
