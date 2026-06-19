"use client";

import * as React from "react";
import type { AiLogsListResponse, AiLogsMetricsResponse } from "@repo/shared";
import { useSearchParams } from "next/navigation";

import {
  mapAiLogListResponse,
  mapAiLogMetricsResponse,
  type AiLog,
  type AiLogMetricCard,
} from "../ai-logs-data";
import { DEFAULT_PAGE_SIZE } from "./constants";
import type { AiLogFilterOption } from "./types";

type UseAiLogsWorkspaceResult = {
  error: string | null;
  from: string;
  hasMore: boolean;
  historyDepth: number;
  isLoading: boolean;
  limit: number;
  logs: AiLog[];
  metrics: AiLogMetricCard[];
  model: string;
  operation: string;
  operationOptions: AiLogFilterOption[];
  nextCursor: string | null;
  selected: AiLog | null;
  setLimit: (nextLimit: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setSelected: (log: AiLog | null) => void;
  status: string;
  to: string;
  updateDateRange: (value: { from: string; to: string }) => void;
  updateModel: (value: string) => void;
  updateOperation: (value: string) => void;
  updateStatus: (value: string) => void;
};

export const useAiLogsWorkspace = (): UseAiLogsWorkspaceResult => {
  const searchParams = useSearchParams();
  const [logs, setLogs] = React.useState<AiLog[]>([]);
  const [pageInfo, setPageInfo] = React.useState<
    AiLogsListResponse["pageInfo"] | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [metrics, setMetrics] = React.useState<AiLogMetricCard[]>([]);
  const [model, setModel] = React.useState(() => searchParams.get("model") ?? "all");
  const [status, setStatus] = React.useState(() => searchParams.get("status") ?? "all");
  const [operation, setOperation] = React.useState(() => searchParams.get("operation") ?? "all");
  const [from, setFrom] = React.useState(() => searchParams.get("from") ?? "");
  const [to, setTo] = React.useState(() => searchParams.get("to") ?? "");
  const [limit, setLimitState] = React.useState(DEFAULT_PAGE_SIZE);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<AiLog | null>(null);

  React.useEffect(() => {
    setModel(searchParams.get("model") ?? "all");
    setStatus(searchParams.get("status") ?? "all");
    setOperation(searchParams.get("operation") ?? "all");
    setFrom(searchParams.get("from") ?? "");
    setTo(searchParams.get("to") ?? "");
    setCursor(null);
    setCursorHistory([]);
  }, [searchParams]);

  React.useEffect(() => {
    const loadLogs = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({
          limit: String(limit),
        });

        if (model !== "all") searchParams.set("model", model);
        if (status !== "all") searchParams.set("status", status);
        if (operation !== "all") searchParams.set("operation", operation);
        if (from) searchParams.set("from", from);
        if (to) searchParams.set("to", to);
        if (cursor) searchParams.set("cursor", cursor);

        const [listResponse, metricsResponse] = await Promise.all([
          fetch(`/api/ai-logs?${searchParams.toString()}`, {
            cache: "no-store",
          }),
          fetch(`/api/ai-logs/metrics?${searchParams.toString()}`, {
            cache: "no-store",
          }),
        ]);
        const [listData, metricsData] = (await Promise.all([
          listResponse.json(),
          metricsResponse.json(),
        ])) as [AiLogsListResponse, AiLogsMetricsResponse];

        if (!listResponse.ok || !metricsResponse.ok) {
          setError("Failed to load AI logs.");
          setLogs([]);
          setMetrics([]);
          setPageInfo(null);
          setSelected(null);
          return;
        }

        const mappedLogs = mapAiLogListResponse(listData);
        setLogs(mappedLogs);
        setMetrics(mapAiLogMetricsResponse(metricsData));
        setPageInfo(listData.pageInfo);
        setSelected(mappedLogs[0] ?? null);
      } catch {
        setError("Failed to load AI logs.");
        setLogs([]);
        setMetrics([]);
        setPageInfo(null);
        setSelected(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadLogs();
  }, [cursor, from, limit, model, operation, status, to]);

  const operationOptions = React.useMemo(
    () => [
      { label: "All operations", value: "all" },
      ...Array.from(new Set(logs.map((log) => log.operation))).map((value) => ({
        label: value,
        value,
      })),
    ],
    [logs],
  );

  const updateModel = (value: string): void => {
    setModel(value);
    setCursor(null);
    setCursorHistory([]);
  };

  const updateStatus = (value: string): void => {
    setStatus(value);
    setCursor(null);
    setCursorHistory([]);
  };

  const updateOperation = (value: string): void => {
    setOperation(value);
    setCursor(null);
    setCursorHistory([]);
  };

  const setLimit = (nextLimit: number): void => {
    setLimitState(nextLimit);
    setCursor(null);
    setCursorHistory([]);
  };

  const updateDateRange = (value: { from: string; to: string }): void => {
    setFrom(value.from);
    setTo(value.to);
    setCursor(null);
    setCursorHistory([]);
  };

  const goToNextPage = (): void => {
    if (!pageInfo?.nextCursor) return;
    setCursorHistory((current) => [...current, cursor ?? ""]);
    setCursor(pageInfo.nextCursor);
  };

  const goToPreviousPage = (): void => {
    setCursorHistory((current) => {
      if (current.length === 0) {
        setCursor(null);
        return current;
      }

      const nextHistory = current.slice(0, -1);
      const previousCursor = current.at(-1) || null;
      setCursor(previousCursor || null);
      return nextHistory;
    });
  };

  return {
    error,
    from,
    hasMore: pageInfo?.hasMore ?? false,
    historyDepth: cursorHistory.length,
    isLoading,
    limit,
    logs,
    metrics,
    model,
    operation,
    operationOptions,
    nextCursor: pageInfo?.nextCursor ?? null,
    selected,
    goToNextPage,
    goToPreviousPage,
    setLimit,
    setSelected,
    status,
    to,
    updateDateRange,
    updateModel,
    updateOperation,
    updateStatus,
  };
};
