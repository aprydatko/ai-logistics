"use client";

import type { AssistantConversationMessage, AssistantLinkedEntity } from "@repo/shared";
import { useEffect, useState } from "react";

import { uploadDocument } from "@/lib/documents/document-mutations";

import {
  initialAssistantModel,
  initialAssistantState,
  initialFilters,
} from "./constants";
import type {
  AssistantApiResponse,
  AssistantAttachment,
  AssistantFilter,
  AssistantMessage,
  AssistantRequestState,
  AssistantSkill,
} from "./types";

type UseAssistantWorkspaceResult = {
  attachment: AssistantAttachment | null;
  assistantState: AssistantRequestState;
  clearAttachment: () => void;
  clearChat: () => void;
  draft: string;
  filters: AssistantFilter[];
  isContextOpen: boolean;
  messages: AssistantMessage[];
  model: string;
  onAttachmentSelect: (file: File | null) => void;
  onSelectSkill: (skill: AssistantSkill | null) => void;
  recentReferences: AssistantLinkedEntity[];
  removeFilter: (label: string) => void;
  selectedSkill: AssistantSkill | null;
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
  const [attachment, setAttachment] = useState<AssistantAttachment | null>(
    null,
  );
  const [selectedSkill, setSelectedSkill] = useState<AssistantSkill | null>(
    null,
  );
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [recentReferences, setRecentReferences] = useState<AssistantLinkedEntity[]>(
    [],
  );
  const [assistantState, setAssistantState] = useState<AssistantRequestState>(
    initialAssistantState,
  );

  const appendRecentReference = (linkedEntity: AssistantLinkedEntity): void => {
    setRecentReferences((current) => {
      const next = [
        linkedEntity,
        ...current.filter(
          (reference) => reference.recordId !== linkedEntity.recordId,
        ),
      ];
      return next.slice(0, 4);
    });
  };

  const updateMessage = (
    messageId: string,
    updater: (message: AssistantMessage) => AssistantMessage,
  ): void => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? updater(message) : message,
      ),
    );
  };

  const fetchAssistantStatus = async (): Promise<void> => {
    setAssistantState(initialAssistantState);

    try {
      const response = await fetch("/api/assistant", { cache: "no-store" });
      const data = (await response.json()) as AssistantApiResponse;

      if (!response.ok) {
        setAssistantState({
          answer: null,
          detail: data.message || "Assistant request failed.",
          linkedEntity: null,
          reportType: null,
          resultView: null,
          status: "error",
          usedTools: [],
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
        linkedEntity: null,
        reportType: null,
        resultView: null,
        status: responseStatus,
        usedTools: [],
      });
    } catch {
      setAssistantState({
        answer: null,
        detail: "Assistant service is unavailable right now.",
        linkedEntity: null,
        reportType: null,
        resultView: null,
        status: "error",
        usedTools: [],
      });
    }
  };

  const runSelectedSkill = async (
    skill: AssistantSkill,
    nextAttachment: AssistantAttachment | null,
  ): Promise<void> => {
    if (skill.id !== "save_document") return;
    if (!nextAttachment) {
      setAssistantState({
        answer: null,
        detail: "Attach a file or photo before running Save document.",
        linkedEntity: null,
        reportType: null,
        resultView: null,
        status: "error",
        usedTools: [],
      });
      return;
    }

    setAssistantState({
      answer: null,
      detail: "Saving document to the system...",
      linkedEntity: null,
      reportType: null,
      resultView: null,
      status: "loading",
      usedTools: [],
    });

    try {
      const document = await uploadDocument({
        analyzeWithVision: true,
        file: nextAttachment.file,
        type: inferDocumentType(nextAttachment.file.name),
      });

      setMessages((current) => [
        ...current,
        {
          attachmentName: nextAttachment.file.name,
          id: crypto.randomUUID(),
          role: "user",
          text: draft.trim() || `Run skill: ${skill.label}`,
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Saved ${document.fileName} as a document. Status: ${document.status.replaceAll("_", " ")}.`,
          usedTools: ["save_document"],
        },
      ]);
      setAssistantState({
        answer: `Saved ${document.fileName} as a document. Status: ${document.status.replaceAll("_", " ")}.`,
        detail:
          document.extractedFields.length > 0
            ? `Document saved and ${document.extractedFields.length} extracted fields were captured for review.`
            : "Document saved successfully.",
        linkedEntity: null,
        reportType: null,
        resultView: null,
        status: "configured",
        usedTools: ["save_document"],
      });
      clearAttachment();
      setDraft("");
      setSelectedSkill(null);
    } catch (error) {
      const normalizedError = normalizeSaveDocumentError(error);
      setAssistantState({
        answer: null,
        detail: normalizedError,
        linkedEntity: null,
        reportType: null,
        resultView: null,
        status: "error",
        usedTools: [],
      });
    }
  };

  const submitAssistantRequest = async (
    nextMessage: string,
    nextModel: string,
    nextAttachment: AssistantAttachment | null,
  ): Promise<void> => {
    setAssistantState({
      answer: null,
      detail: nextAttachment
        ? `Sending message with ${nextModel} and 1 attachment...`
        : `Sending message with ${nextModel}...`,
      linkedEntity: assistantState.linkedEntity,
      reportType: null,
      resultView: null,
      status: "loading",
      usedTools: [],
    });

    try {
      const userMessage: AssistantMessage = {
        attachmentName: nextAttachment?.file.name,
        id: crypto.randomUUID(),
        linkedEntity: assistantState.linkedEntity,
        role: "user",
        text: nextMessage,
      };
      const pendingAssistantId = crypto.randomUUID();
      const pendingAssistantMessage: AssistantMessage = {
        id: pendingAssistantId,
        linkedEntity: assistantState.linkedEntity,
        role: "assistant",
        text: "",
        usedTools: [],
      };
      const nextHistory = [...messages, userMessage];
      setMessages([...nextHistory, pendingAssistantMessage]);

      const body = new FormData();
      body.append("message", nextMessage);
      body.append("model", nextModel);
      body.append("stream", "true");
      body.append(
        "history",
        JSON.stringify(
          nextHistory
            .slice(-6, -1)
            .map<AssistantConversationMessage>(({ role, text }) => ({
              role,
              text,
            })),
        ),
      );
      if (assistantState.linkedEntity) {
        body.append("linkedEntity", JSON.stringify(assistantState.linkedEntity));
      }
      if (nextAttachment) {
        body.append("file", nextAttachment.file);
      }

      const response = await fetch("/api/assistant", {
        method: "POST",
        body,
      });

      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        await readAssistantStream({
          onChunk: (delta) => {
            updateMessage(pendingAssistantId, (message) => ({
              ...message,
              text: `${message.text}${delta}`,
            }));
            setAssistantState((current) => ({
              ...current,
              answer: null,
              detail: `Streaming response from ${nextModel}...`,
            }));
          },
          onStatus: (detail) => {
            setAssistantState((current) => ({
              ...current,
              detail,
            }));
          },
          onDone: (data) => {
            const responseStatus =
              data.status === "placeholder"
                ? "placeholder"
                : data.status === "configured"
                  ? "configured"
                  : "error";
            const linkedEntity =
              data.linkedEntity ?? assistantState.linkedEntity ?? null;
            const requestedModel = data.request?.model ?? nextModel;
            const statusDetail =
              responseStatus === "configured"
                ? `Chat response received from ${requestedModel}.`
                : `${data.message} Requested model: ${requestedModel}.`;

            setAssistantState({
              answer: null,
              detail: statusDetail,
              linkedEntity,
              reportType: data.reportType ?? null,
              resultView: data.resultView ?? null,
              status: responseStatus,
              usedTools: data.usedTools ?? [],
            });

            if (responseStatus === "configured" && data.message) {
              clearAttachment();
              setDraft("");
              updateMessage(pendingAssistantId, (message) => ({
                ...message,
                linkedEntity,
                reportType: data.reportType ?? null,
                text: data.message,
                usedTools: data.usedTools ?? [],
              }));
              if (linkedEntity) {
                appendRecentReference(linkedEntity);
              }
            } else {
              setMessages((current) =>
                current.filter((message) => message.id !== pendingAssistantId),
              );
            }
          },
          onError: (message) => {
            setMessages((current) =>
              current.filter((item) => item.id !== pendingAssistantId),
            );
            setAssistantState({
              answer: null,
              detail: message,
              linkedEntity: assistantState.linkedEntity,
              reportType: null,
              resultView: null,
              status: "error",
              usedTools: [],
            });
          },
          response,
        });
        return;
      }

      const data = (await response.json()) as AssistantApiResponse;

      if (!response.ok && data.status !== "placeholder") {
        setAssistantState({
          answer: null,
          detail: data.message || "Assistant request failed.",
          linkedEntity: assistantState.linkedEntity,
          reportType: null,
          resultView: null,
          status: "error",
          usedTools: [],
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
          ? nextAttachment
            ? `Chat response received from ${requestedModel} with attachment context.`
            : `Chat response received from ${requestedModel}.`
          : `${data.message} Requested model: ${requestedModel}.`;

      setAssistantState({
        answer: null,
        detail: statusDetail,
        linkedEntity: data.linkedEntity ?? assistantState.linkedEntity ?? null,
        reportType: data.reportType ?? null,
        resultView: data.resultView ?? null,
        status: responseStatus,
        usedTools: data.usedTools ?? [],
      });
      if (responseStatus === "configured" && data.message) {
        clearAttachment();
        setDraft("");
        const linkedEntity = data.linkedEntity ?? assistantState.linkedEntity ?? null;
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            linkedEntity,
            role: "assistant",
            reportType: data.reportType ?? null,
            text: data.message,
            usedTools: data.usedTools ?? [],
          },
        ]);
        if (linkedEntity) {
          appendRecentReference(linkedEntity);
        }
      }
    } catch {
      setAssistantState({
        answer: null,
        detail: "Assistant service is unavailable right now.",
        linkedEntity: assistantState.linkedEntity,
        reportType: null,
        resultView: null,
        status: "error",
        usedTools: [],
      });
    }
  };

  useEffect(() => {
    void fetchAssistantStatus();
  }, []);

  useEffect(
    () => () => {
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    },
    [attachment],
  );

  const submit = (): void => {
    const nextMessage = draft.trim();
    if (!nextMessage && !selectedSkill) return;
    const nextAttachment = attachment;
    if (selectedSkill) {
      void runSelectedSkill(selectedSkill, nextAttachment);
      return;
    }
    void submitAssistantRequest(nextMessage, model, nextAttachment);
  };

  const onAttachmentSelect = (file: File | null): void => {
    setAttachment((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      if (!file) return null;

      const isImage = file.type.startsWith("image/");

      return {
        file,
        id: `${file.name}-${file.lastModified}`,
        kind: isImage ? "image" : "file",
        previewUrl: isImage ? URL.createObjectURL(file) : null,
      };
    });
  };

  const clearAttachment = (): void => {
    setAttachment((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return null;
    });
  };

  const clearChat = (): void => {
    clearAttachment();
    setDraft("");
    setMessages([]);
    setRecentReferences([]);
    setSelectedSkill(null);
    setAssistantState((current) => ({
      answer: null,
      detail:
        current.status === "placeholder"
          ? current.detail
          : "Chat cleared. Start a new request.",
      linkedEntity: null,
      reportType: null,
      resultView: null,
      status: current.status === "placeholder" ? "placeholder" : "idle",
      usedTools: [],
    }));
  };

  const onSelectSkill = (skill: AssistantSkill | null): void => {
    setSelectedSkill(skill);
  };

  const removeFilter = (label: string): void => {
    setFilters((current) => current.filter((filter) => filter.label !== label));
  };

  return {
    attachment,
    assistantState,
    clearAttachment,
    clearChat,
    draft,
    filters,
    isContextOpen,
    messages,
    model,
    onAttachmentSelect,
    onSelectSkill,
    recentReferences,
    removeFilter,
    selectedSkill,
    setDraft,
    setIsContextOpen,
    setModel,
    submit,
  };
};

const readAssistantStream = async ({
  onChunk,
  onStatus,
  onDone,
  onError,
  response,
}: {
  onChunk: (delta: string) => void;
  onStatus: (detail: string) => void;
  onDone: (data: AssistantApiResponse) => void;
  onError: (message: string) => void;
  response: Response;
}): Promise<void> => {
  if (!response.body) {
    onError("Assistant stream is unavailable.");
    return;
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      const eventName =
        rawEvent
          .split("\n")
          .find((line) => line.startsWith("event:"))
          ?.replace("event:", "")
          .trim() ?? "message";
      const dataLine = rawEvent
        .split("\n")
        .find((line) => line.startsWith("data:"));

      if (!dataLine) continue;
      const data = JSON.parse(dataLine.replace("data:", "").trim()) as
        | { delta: string }
        | { detail: string }
        | AssistantApiResponse;

      if (eventName === "chunk" && "delta" in data) {
        onChunk(data.delta);
        continue;
      }

      if (eventName === "status" && "detail" in data) {
        onStatus(data.detail);
        continue;
      }

      if (eventName === "done" && "message" in data) {
        onDone(data);
        continue;
      }

      if (eventName === "error" && "message" in data) {
        onError(data.message || "Assistant stream failed.");
      }
    }
  }

  if (buffer.trim()) {
    onError("Assistant stream ended unexpectedly.");
  }
};

const inferDocumentType = (
  fileName: string,
):
  | "bill_of_lading"
  | "proof_of_delivery"
  | "rate_confirmation"
  | "driver_license" => {
  const normalized = fileName.toLowerCase();

  if (normalized.includes("pod") || normalized.includes("delivery")) {
    return "proof_of_delivery";
  }
  if (normalized.includes("rate")) {
    return "rate_confirmation";
  }
  if (normalized.includes("license")) {
    return "driver_license";
  }
  return "bill_of_lading";
};

const normalizeSaveDocumentError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "Unable to save document right now.";
  }

  if (error.message.toLowerCase().includes("internal server error")) {
    return [
      "Internal server error while saving the document.",
      "If you recently added upload storage fields, make sure the API migration for documents upload columns has been applied.",
    ].join(" ");
  }

  return error.message;
};
