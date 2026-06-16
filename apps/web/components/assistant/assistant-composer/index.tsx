"use client";

import {
  BarChart3,
  Bot,
  FileText,
  Paperclip,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { Button } from "@repo/ui/components/button";
import { SelectButton } from "@repo/ui/components/select-button";

import type { AssistantAttachment, AssistantSkill } from "../workspace/types";

const modelOptions = [
  { label: "GPT-4.1", value: "gpt-4.1" },
  { label: "GPT-4.1 mini", value: "gpt-4.1-mini" },
  { label: "o3", value: "o3" },
];

type AssistantComposerProps = {
  attachment: AssistantAttachment | null;
  draft: string;
  isSubmitting?: boolean;
  model: string;
  onAttachmentSelect: (file: File | null) => void;
  onClearAttachment: () => void;
  onClearSkill: () => void;
  onDraftChange: (value: string) => void;
  onModelChange: (value: string) => void;
  selectedSkill: AssistantSkill | null;
  onSubmit: () => void;
};

export const AssistantComposer = ({
  attachment,
  draft,
  isSubmitting = false,
  model,
  onAttachmentSelect,
  onClearAttachment,
  onClearSkill,
  onDraftChange,
  onModelChange,
  selectedSkill,
  onSubmit,
}: AssistantComposerProps): React.JSX.Element => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="shrink-0 rounded-2xl border border-border bg-card p-3 shadow-xs focus-within:border-blue-400 focus-within:ring-3 focus-within:ring-blue-100">
      {attachment ? (
        <div className="mb-3 rounded-2xl border border-border/80 bg-surface-100/80 p-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {attachment.kind === "image" && attachment.previewUrl ? (
                <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border bg-white">
                  <Image
                    alt={attachment.file.name}
                    className="object-cover"
                    fill
                    src={attachment.previewUrl}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-white text-primary-700">
                  <FileText className="size-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {attachment.file.name}
                </p>
                <p className="text-xs text-primary-700">
                  {attachment.kind === "image"
                    ? "Image ready to send"
                    : "File ready to send"}
                  {" · "}
                  {formatFileSize(attachment.file.size)}
                </p>
              </div>
            </div>
            <Button
              aria-label="Remove attachment"
              onClick={onClearAttachment}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          </div>
        </div>
      ) : null}

      {selectedSkill ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900">
          <div className="flex min-w-0 items-center gap-2">
            <ShieldCheck className="size-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                Skill
              </p>
              <p className="truncate text-sm font-semibold">
                {selectedSkill.label}
              </p>
            </div>
          </div>
          <Button
            aria-label="Remove selected skill"
            onClick={onClearSkill}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        </div>
      ) : null}

      <textarea
        aria-label="Ask AI Assistant"
        className="min-h-16 w-full resize-none bg-transparent px-2 py-1 text-sm text-ink-900 outline-none placeholder:text-primary-700/70"
        disabled={isSubmitting}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder={
          selectedSkill
            ? "Optional note for the selected skill..."
            : "Ask about loads, drivers, incidents, performance..."
        }
        value={draft}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center">
          <Button
            aria-label="Attach file"
            onClick={() => inputRef.current?.click()}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Paperclip />
          </Button>
          <input
            accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
            className="sr-only"
            onChange={(event) => {
              onAttachmentSelect(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
            ref={inputRef}
            type="file"
          />
          <Button
            aria-label="Add chart"
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <BarChart3 />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Bot className="hidden size-4 text-primary-700 sm:block" />
          <SelectButton
            className="h-9 min-w-36 border-0 px-2 text-xs font-semibold shadow-none"
            onValueChange={onModelChange}
            options={modelOptions}
            placeholder="Select model"
            value={model}
          />
          <Button
            aria-label="Send message"
            className="bg-primary-700 hover:bg-primary-600"
            disabled={
              isSubmitting ||
              (!draft.trim() && !selectedSkill) ||
              (selectedSkill?.id === "save_document" && !attachment)
            }
            onClick={onSubmit}
            size="icon"
            type="button"
          >
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
};

const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
