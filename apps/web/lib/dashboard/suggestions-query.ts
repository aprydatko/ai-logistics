import { queryOptions } from "@tanstack/react-query";
import type { AiLogsListResponse, AiLogsMetricsResponse } from "@repo/shared";

import {
  DASHBOARD_QUERY_STALE_TIME,
  dashboardQueryKeys,
} from "./dashboard-query";

export type DashboardSuggestionItem = {
  detail: string;
  href: string;
  id: string;
  tone: "info" | "warning";
  title: string;
};

type DashboardSuggestionsResult = {
  suggestions: DashboardSuggestionItem[];
};

const formatDuration = (latencyMs: number): string =>
  `${(latencyMs / 1000).toFixed(latencyMs >= 10_000 ? 0 : 1)}s`;

const formatCompactNumber = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);

const formatCost = (value: number): string => `$${value.toFixed(3)}`;

const formatRelativeTime = (value: string | null): string => {
  const timestamp = value ? new Date(value).getTime() : NaN;
  if (Number.isNaN(timestamp)) {
    return "recently";
  }

  const diffMs = timestamp - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const relativeTimeFormat = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormat.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormat.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormat.format(diffDays, "day");
};

const getLatestTimestamp = (value: {
  completedAt?: string | null;
  createdAt: string;
}): string => value.completedAt ?? value.createdAt;

const buildSuggestions = (
  logsResponse: AiLogsListResponse,
  metricsResponse: AiLogsMetricsResponse,
): DashboardSuggestionItem[] => {
  const logs = logsResponse.data;
  const metrics = metricsResponse.data;
  const suggestions: DashboardSuggestionItem[] = [];

  const failedLogs = logs.filter((log) => log.status === "failed");
  const latestFailure = failedLogs[0];
  if (latestFailure) {
    suggestions.push({
      detail: `${latestFailure.operation} on ${latestFailure.model} failed ${formatRelativeTime(getLatestTimestamp(latestFailure))}.`,
      href: "/ai-logs?status=failed",
      id: `failed-${latestFailure.id}`,
      tone: "warning",
      title:
        failedLogs.length > 1
          ? `Review ${failedLogs.length} failed AI runs`
          : "Review the latest failed AI run",
    });
  }

  const slowestLog = [...logs].sort(
    (left, right) => right.latencyMs - left.latencyMs,
  )[0];
  if (slowestLog && slowestLog.latencyMs >= 10_000) {
    suggestions.push({
      detail: `${slowestLog.operation} took ${formatDuration(slowestLog.latencyMs)} on ${slowestLog.model}.`,
      href: "/ai-logs",
      id: `latency-${slowestLog.id}`,
      tone: "warning",
      title: "Latency spike needs review",
    });
  }

  const latestSuccessfulLog = logs.find((log) => log.status === "success");
  if (latestSuccessfulLog) {
    const linkedLabel = latestSuccessfulLog.linkedEntity?.title
      ? ` linked to ${latestSuccessfulLog.linkedEntity.title}`
      : "";

    suggestions.push({
      detail: `${formatCompactNumber(metrics.totals.requests)} requests, ${formatCompactNumber(metrics.totals.tokens)} tokens, ${formatCost(metrics.totals.costUsd)} estimated cost.`,
      href: "/ai-logs",
      id: `usage-${latestSuccessfulLog.id}`,
      tone: "info",
      title: `Latest AI activity: ${latestSuccessfulLog.operation}${linkedLabel}`,
    });
  } else if (metrics.totals.requests > 0) {
    suggestions.push({
      detail: `${formatCompactNumber(metrics.totals.requests)} requests logged, ${metrics.totals.errors} errors, ${formatCost(metrics.totals.costUsd)} estimated cost.`,
      href: "/ai-logs",
      id: "usage-summary",
      tone: "info",
      title: "AI activity summary",
    });
  }

  return suggestions.slice(0, 3);
};

export const fetchDashboardSuggestions =
  async (): Promise<DashboardSuggestionsResult> => {
    const [logsResponse, metricsResponse] = await Promise.all([
      fetch("/api/ai-logs?limit=10", { cache: "no-store" }),
      fetch("/api/ai-logs/metrics", { cache: "no-store" }),
    ]);

    if (!logsResponse.ok || !metricsResponse.ok) {
      throw new Error("Unable to load AI dashboard suggestions");
    }

    const [logsData, metricsData] = (await Promise.all([
      logsResponse.json(),
      metricsResponse.json(),
    ])) as [AiLogsListResponse, AiLogsMetricsResponse];

    return {
      suggestions: buildSuggestions(logsData, metricsData),
    };
  };

export const dashboardSuggestionsQueryOptions = () =>
  queryOptions({
    queryKey: dashboardQueryKeys.suggestions(),
    queryFn: fetchDashboardSuggestions,
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });
