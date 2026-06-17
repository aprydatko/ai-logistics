"use client";

import type {
  AssistantConversationMessage,
  AssistantLinkedEntity,
} from "@repo/shared";
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

type AssistantJobCreateResponse = {
  success: true;
  data: {
    jobId: string;
    status: "queued";
  };
};

type AssistantJobStatusResponse = {
  success: true;
  data: {
    error?: string;
    jobId: string;
    result?: AssistantApiResponse;
    status:
      | "active"
      | "completed"
      | "delayed"
      | "failed"
      | "paused"
      | "prioritized"
      | "unknown"
      | "waiting"
      | "waiting-children";
  };
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
  const [recentReferences, setRecentReferences] = useState<
    AssistantLinkedEntity[]
  >([]);
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
          text:
            document.status === "processing"
              ? `Saved ${document.fileName} as a document. Background processing started.`
              : `Saved ${document.fileName} as a document. Status: ${document.status.replaceAll("_", " ")}.`,
          usedTools: ["save_document"],
        },
      ]);
      setAssistantState({
        answer:
          document.status === "processing"
            ? `Saved ${document.fileName} as a document. Background processing started.`
            : `Saved ${document.fileName} as a document. Status: ${document.status.replaceAll("_", " ")}.`,
        detail:
          document.status === "processing"
            ? "The document was uploaded and is being analyzed in the background. The status will update live when extraction finishes."
            : document.extractedFields.length > 0
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
      updateMessage(pendingAssistantId, (message) => ({
        ...message,
        text: "Working on it...",
      }));

      const attachmentPayload = nextAttachment
        ? await toAssistantAttachmentPayload(nextAttachment.file)
        : null;
      const history = nextHistory
        .slice(-6, -1)
        .map<AssistantConversationMessage>(({ role, text }) => ({
          role,
          text,
        }));

      const createJobResponse = await fetch("/api/assistant/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attachment: attachmentPayload,
          history,
          ...(assistantState.linkedEntity
            ? { linkedEntity: assistantState.linkedEntity }
            : {}),
          message: nextMessage,
          model: nextModel,
          source: "web",
        }),
      });

      const createJobData = (await createJobResponse.json()) as
        | AssistantJobCreateResponse
        | {
            message?: string;
          };

      if (!createJobResponse.ok || !("success" in createJobData)) {
        setMessages((current) =>
          current.filter((item) => item.id !== pendingAssistantId),
        );
        setAssistantState({
          answer: null,
          detail:
            getAssistantJobErrorMessage(createJobData) ||
            "Unable to queue assistant request.",
          linkedEntity: assistantState.linkedEntity,
          reportType: null,
          resultView: null,
          status: "error",
          usedTools: [],
        });
        return;
      }

      setAssistantState((current) => ({
        ...current,
        detail: "Assistant job queued. Waiting for a worker...",
      }));

      const jobData = await pollAssistantJob(createJobData.data.jobId, {
        onStatus: (status) => {
          setAssistantState((current) => ({
            ...current,
            detail: toAssistantJobDetail(status, nextModel),
          }));
        },
      });

      if (jobData.status === "failed") {
        setMessages((current) =>
          current.filter((item) => item.id !== pendingAssistantId),
        );
        setAssistantState({
          answer: null,
          detail: jobData.error || "Assistant job failed.",
          linkedEntity: assistantState.linkedEntity,
          reportType: null,
          resultView: null,
          status: "error",
          usedTools: [],
        });
        return;
      }

      const data = jobData.result;
      if (!data) {
        setMessages((current) =>
          current.filter((item) => item.id !== pendingAssistantId),
        );
        setAssistantState({
          answer: null,
          detail: "Assistant job completed without a response.",
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

const toAssistantAttachmentPayload = async (
  file: File,
): Promise<{
  fileData: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  name: string;
}> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return {
    fileData: btoa(binary),
    mimeType: file.type as
      | "application/pdf"
      | "image/jpeg"
      | "image/png"
      | "image/webp",
    name: file.name,
  };
};

const pollAssistantJob = async (
  jobId: string,
  callbacks: {
    onStatus: (status: AssistantJobStatusResponse["data"]["status"]) => void;
  },
): Promise<AssistantJobStatusResponse["data"]> => {
  let attempts = 0;

  while (attempts < 60) {
    attempts += 1;

    const response = await fetch(`/api/assistant/jobs/${jobId}`, {
      cache: "no-store",
    });
    const data = (await response.json()) as
      | AssistantJobStatusResponse
      | {
          message?: string;
        };

    if (!response.ok || !("success" in data)) {
      throw new Error(
        getAssistantJobErrorMessage(data) ||
          "Unable to load assistant job status.",
      );
    }

    callbacks.onStatus(data.data.status);

    if (data.data.status === "completed" || data.data.status === "failed") {
      return data.data;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error("Assistant job timed out.");
};

const toAssistantJobDetail = (
  status: AssistantJobStatusResponse["data"]["status"],
  model: string,
): string => {
  switch (status) {
    case "waiting":
    case "waiting-children":
    case "delayed":
    case "prioritized":
      return "Assistant job queued. Waiting for a worker...";
    case "active":
      return `Assistant is processing your request with ${model}...`;
    case "paused":
      return "Assistant queue is paused.";
    case "unknown":
      return "Checking assistant job status...";
    default:
      return `Assistant is processing your request with ${model}...`;
  }
};

const getAssistantJobErrorMessage = (value: unknown): string | null => {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return null;
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
