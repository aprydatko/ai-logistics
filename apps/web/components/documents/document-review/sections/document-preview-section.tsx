"use client";

import type { Document } from "@repo/shared";
import {
  Download,
  Expand,
  Minimize,
  RotateCcw,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { FilePreview } from "../file-preview";
import { ReviewIconButton } from "../review-icon-button";
import { useDocumentFileUrl } from "@/lib/documents/use-document-file-url";

export const DocumentPreviewSection = ({
  document,
  isFullscreen,
  onToggleFullscreen,
  previewRef,
}: {
  document: Document;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  previewRef: React.RefObject<HTMLElement | null>;
}): React.JSX.Element => {
  const resolvedFileUrl = useDocumentFileUrl(document);
  const pageCount = document.pageCount ?? 1;

  return (
    <section
      className={`overflow-hidden bg-card shadow-sm ${
        isFullscreen
          ? "flex h-screen flex-col rounded-none border-0"
          : "rounded-lg border border-border"
      }`}
      ref={previewRef}
    >
      <h2 className="border-b border-border px-4 py-3 text-base font-semibold">
        Raw file preview
      </h2>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <ReviewIconButton disabled label="Search document">
          <Search className="size-4" />
        </ReviewIconButton>
        <div className="mx-1 h-7 border-l border-border" />
        <ReviewIconButton disabled label="Zoom out">
          <ZoomOut className="size-4" />
        </ReviewIconButton>
        <ReviewIconButton disabled label="Zoom in">
          <ZoomIn className="size-4" />
        </ReviewIconButton>
        <span className="ml-2 rounded-md border border-border px-3 py-2 text-sm font-semibold">
          1
        </span>
        <span className="text-sm text-ink-500">/ {pageCount}</span>
        <ReviewIconButton disabled label="Rotate">
          <RotateCcw className="size-4" />
        </ReviewIconButton>
        <ReviewIconButton
          label={isFullscreen ? "Exit full screen" : "Open full screen"}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="size-4" />
          ) : (
            <Expand className="size-4" />
          )}
        </ReviewIconButton>
        <div className="ml-auto">
          {resolvedFileUrl ? (
            <a
              aria-label="Download preview"
              className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-primary-700 transition hover:bg-surface-100"
              download={document.fileName}
              href={resolvedFileUrl}
            >
              <Download className="size-4" />
            </a>
          ) : null}
        </div>
      </div>
      <div
        className={`overflow-auto bg-surface-100 p-4 ${
          isFullscreen ? "min-h-0 flex-1" : ""
        }`}
      >
        <div className="mx-auto h-full w-full overflow-hidden rounded-sm border border-border bg-white shadow-sm">
          <FilePreview document={document} isFullscreen={isFullscreen} />
        </div>
      </div>
    </section>
  );
};
