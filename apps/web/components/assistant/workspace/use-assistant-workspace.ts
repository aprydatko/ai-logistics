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
        status: responseStatus,
        usedTools: [],
      });
    } catch {
      setAssistantState({
        answer: null,
        detail: "Assistant service is unavailable right now.",
        linkedEntity: null,
        reportType: null,
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
      const nextHistory = [...messages, userMessage];
      setMessages(nextHistory);

      const body = new FormData();
      body.append("message", nextMessage);
      body.append("model", nextModel);
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
      const data = (await response.json()) as AssistantApiResponse;

      if (!response.ok && data.status !== "placeholder") {
        setAssistantState({
          answer: null,
          detail: data.message || "Assistant request failed.",
          linkedEntity: assistantState.linkedEntity,
          reportType: null,
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
        answer: responseStatus === "configured" ? data.message : null,
        detail: statusDetail,
        linkedEntity: data.linkedEntity ?? assistantState.linkedEntity ?? null,
        reportType: data.reportType ?? null,
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
            text: data.message,
          },
        ]);
        if (linkedEntity) {
          setRecentReferences((current) => {
            const next = [
              linkedEntity,
              ...current.filter(
                (reference) => reference.recordId !== linkedEntity.recordId,
              ),
            ];
            return next.slice(0, 4);
          });
        }
      }
    } catch {
      setAssistantState({
        answer: null,
        detail: "Assistant service is unavailable right now.",
        linkedEntity: assistantState.linkedEntity,
        reportType: null,
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
