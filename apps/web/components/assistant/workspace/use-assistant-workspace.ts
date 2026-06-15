"use client";

import { useEffect, useState } from "react";

import {
  initialAssistantModel,
  initialAssistantState,
  initialFilters,
} from "./constants";
import type {
  AssistantApiResponse,
  AssistantFilter,
  AssistantRequestState,
} from "./types";

type UseAssistantWorkspaceResult = {
  assistantState: AssistantRequestState;
  draft: string;
  filters: AssistantFilter[];
  isContextOpen: boolean;
  model: string;
  removeFilter: (label: string) => void;
  setDraft: (value: string) => void;
  setIsContextOpen: (value: boolean) => void;
  setModel: (value: string) => void;
  submit: () => void;
};

export const useAssistantWorkspace = (): UseAssistantWorkspaceResult => {
  const [filters, setFilters] = useState(initialFilters);
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState(initialAssistantModel);
  const [isContextOpen, setIsContextOpen] = useState(true);
  const [assistantState, setAssistantState] = useState<AssistantRequestState>(
    initialAssistantState,
  );

  const fetchAssistantStatus = async (): Promise<void> => {
    setAssistantState(initialAssistantState);

    try {
      const response = await fetch("/api/assistant", { cache: "no-store" });
      const data = (await response.json()) as AssistantApiResponse;

      if (!response.ok) {
        setAssistantState({
          answer: null,
          detail: data.message || "Assistant request failed.",
          status: "error",
        });
        return;
      }

      const responseStatus =
        data.status === "placeholder"
          ? "placeholder"
          : data.status === "configured"
            ? "configured"
            : "error";

      setAssistantState({
        answer: null,
        detail: data.message,
        status: responseStatus,
      });
    } catch {
      setAssistantState({
        answer: null,
        detail: "Assistant service is unavailable right now.",
        status: "error",
      });
    }
  };

  const submitAssistantRequest = async (
    nextMessage: string,
    nextModel: string,
  ): Promise<void> => {
    setAssistantState({
      answer: null,
      detail: `Sending message with ${nextModel}...`,
      status: "loading",
    });

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: nextMessage,
          model: nextModel,
        }),
      });
      const data = (await response.json()) as AssistantApiResponse;

      if (!response.ok && data.status !== "placeholder") {
        setAssistantState({
          answer: null,
          detail: data.message || "Assistant request failed.",
          status: "error",
        });
        return;
      }

      const responseStatus =
        data.status === "placeholder"
          ? "placeholder"
          : data.status === "configured"
            ? "configured"
            : "error";
      const requestedModel = data.request?.model ?? nextModel;
      const statusDetail =
        responseStatus === "configured"
          ? `Chat response received from ${requestedModel}.`
          : `${data.message} Requested model: ${requestedModel}.`;

      setAssistantState({
        answer: responseStatus === "configured" ? data.message : null,
        detail: statusDetail,
        status: responseStatus,
      });
    } catch {
      setAssistantState({
        answer: null,
        detail: "Assistant service is unavailable right now.",
        status: "error",
      });
    }
  };

  useEffect(() => {
    void fetchAssistantStatus();
  }, []);

  const submit = (): void => {
    const nextMessage = draft.trim();
    if (!nextMessage) return;
    setDraft("");
    void submitAssistantRequest(nextMessage, model);
  };

  const removeFilter = (label: string): void => {
    setFilters((current) => current.filter((filter) => filter.label !== label));
  };

  return {
    assistantState,
    draft,
    filters,
    isContextOpen,
    model,
    removeFilter,
    setDraft,
    setIsContextOpen,
    setModel,
    submit,
  };
};
