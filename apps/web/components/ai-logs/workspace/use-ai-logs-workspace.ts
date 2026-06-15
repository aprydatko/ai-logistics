"use client";

import * as React from "react";
import type { AiLogsListResponse } from "@repo/shared";

import { mapAiLogListResponse, type AiLog } from "../ai-logs-data";
import { DEFAULT_PAGE_SIZE } from "./constants";
import type { AiLogFilterOption } from "./types";

type UseAiLogsWorkspaceResult = {
  endItem: number;
  error: string | null;
  isLoading: boolean;
  limit: number;
  logs: AiLog[];
  model: string;
  operation: string;
  operationOptions: AiLogFilterOption[];
  page: number;
  selected: AiLog | null;
  setLimit: (nextLimit: number) => void;
  setPage: (nextPage: number) => void;
  setSelected: (log: AiLog | null) => void;
  startItem: number;
  status: string;
  totalItems: number;
  totalPages: number;
  updateModel: (value: string) => void;
  updateOperation: (value: string) => void;
  updateStatus: (value: string) => void;
};

export const useAiLogsWorkspace = (): UseAiLogsWorkspaceResult => {
  const [logs, setLogs] = React.useState<AiLog[]>([]);
  const [pagination, setPagination] = React.useState<
    AiLogsListResponse["pagination"] | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [model, setModel] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [operation, setOperation] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [limit, setLimitState] = React.useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = React.useState<AiLog | null>(null);

  React.useEffect(() => {
    const loadLogs = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (model !== "all") searchParams.set("model", model);
        if (status !== "all") searchParams.set("status", status);
        if (operation !== "all") searchParams.set("operation", operation);

        const response = await fetch(
          `/api/ai-logs?${searchParams.toString()}`,
          {
            cache: "no-store",
          },
        );
        const data = (await response.json()) as AiLogsListResponse;

        if (!response.ok) {
          setError("Failed to load AI logs.");
          setLogs([]);
          setPagination(null);
          setSelected(null);
          return;
        }

        const mappedLogs = mapAiLogListResponse(data);
        setLogs(mappedLogs);
        setPagination(data.pagination);
        setSelected(mappedLogs[0] ?? null);
      } catch {
        setError("Failed to load AI logs.");
        setLogs([]);
        setPagination(null);
        setSelected(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadLogs();
  }, [limit, model, operation, page, status]);

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

  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const totalItems = pagination?.total ?? 0;
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  const updateModel = (value: string): void => {
    setModel(value);
    setPage(1);
  };

  const updateStatus = (value: string): void => {
    setStatus(value);
    setPage(1);
  };

  const updateOperation = (value: string): void => {
    setOperation(value);
    setPage(1);
  };

  const setLimit = (nextLimit: number): void => {
    setLimitState(nextLimit);
    setPage(1);
  };

  return {
    endItem,
    error,
    isLoading,
    limit,
    logs,
    model,
    operation,
    operationOptions,
    page,
    selected,
    setLimit,
    setPage,
    setSelected,
    startItem,
    status,
    totalItems,
    totalPages,
    updateModel,
    updateOperation,
    updateStatus,
  };
};
