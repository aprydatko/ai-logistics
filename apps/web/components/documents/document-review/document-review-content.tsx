"use client";

import type { Document } from "@repo/shared";
import { LoaderCircle } from "lucide-react";
import * as React from "react";

import { AuditLinksForm } from "./forms/audit-links-form";
import { ExtractedFieldsForm } from "./forms/extracted-fields-form";
import { MetadataForm } from "./forms/metadata-form";
import {
  DocumentReviewHeader,
  type DocumentReviewTab,
} from "./document-review-header";
import { getAuditEvents, type AuditEvent } from "./review-data";
import { AuditLinksSection } from "./sections/audit-links-section";
import { DocumentPreviewSection } from "./sections/document-preview-section";
import { ExtractedFieldsSection } from "./sections/extracted-fields-section";
import { MetadataSection } from "./sections/metadata-section";

export const DocumentReviewContent = ({
  document,
}: {
  document: Document;
}): React.JSX.Element => {
  const previewRef = React.useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [activeTab, setActiveTab] =
    React.useState<DocumentReviewTab>("overview");
  const [draftDocument, setDraftDocument] = React.useState(document);
  const [draftAuditEvents, setDraftAuditEvents] = React.useState<AuditEvent[]>(
    () => getAuditEvents(document),
  );

  React.useEffect(() => {
    setDraftDocument(document);
    setDraftAuditEvents(getAuditEvents(document));
  }, [document]);

  React.useEffect(() => {
    const handleFullscreenChange = (): void => {
      setIsFullscreen(
        globalThis.document.fullscreenElement === previewRef.current,
      );
    };

    globalThis.document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () =>
      globalThis.document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
  }, []);

  const toggleFullscreen = async (): Promise<void> => {
    if (globalThis.document.fullscreenElement) {
      await globalThis.document.exitFullscreen();
      return;
    }

    await previewRef.current?.requestFullscreen();
  };

  return (
    <div className="-m-4 min-h-full bg-surface-50 lg:-mt-5 lg:-ml-6">
      <DocumentReviewHeader
        activeTab={activeTab}
        document={draftDocument}
        onTabChange={setActiveTab}
      />

      <main className="space-y-4 p-4 lg:p-5">
        {draftDocument.status === "processing" ? (
          <section className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 px-4 py-3 text-sm text-ink-700">
            <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-info" />
            <div className="space-y-1">
              <p className="font-medium text-ink-900">
                Processing in background
              </p>
              <p>
                AI extraction is still running. This page will update
                automatically when document processing finishes.
              </p>
            </div>
          </section>
        ) : null}
        {activeTab === "overview" ? (
          <>
            <div className="grid gap-4 2xl:grid-cols-[1.08fr_1fr]">
              <DocumentPreviewSection
                document={draftDocument}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => void toggleFullscreen()}
                previewRef={previewRef}
              />

              <div className="space-y-4">
                <ExtractedFieldsSection document={draftDocument} />
                <MetadataSection document={draftDocument} />
              </div>
            </div>

            <AuditLinksSection
              document={draftDocument}
              events={draftAuditEvents}
            />
          </>
        ) : null}
        {activeTab === "metadata" ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_1.05fr]">
            <MetadataSection document={draftDocument} />
            <MetadataForm
              documentId={draftDocument.id}
              onChange={(value) =>
                setDraftDocument((currentDocument) => ({
                  ...currentDocument,
                  ...value,
                }))
              }
              onSaved={setDraftDocument}
              value={{
                fileName: draftDocument.fileName,
                mimeType: draftDocument.mimeType,
                extractionModel: draftDocument.extractionModel,
                pageCount: draftDocument.pageCount,
                processingTimeMs: draftDocument.processingTimeMs,
              }}
            />
          </div>
        ) : null}
        {activeTab === "fields" ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_1.05fr]">
            <ExtractedFieldsSection document={draftDocument} />
            <ExtractedFieldsForm
              documentId={draftDocument.id}
              fields={draftDocument.extractedFields}
              onChange={(fields) =>
                setDraftDocument((currentDocument) => ({
                  ...currentDocument,
                  extractedFields: fields,
                }))
              }
              onSaved={setDraftDocument}
            />
          </div>
        ) : null}
        {activeTab === "audit" ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_1.05fr]">
            <AuditLinksSection
              document={draftDocument}
              events={draftAuditEvents}
            />
            <AuditLinksForm
              documentId={draftDocument.id}
              events={draftAuditEvents}
              onChange={setDraftAuditEvents}
              onSaved={setDraftAuditEvents}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
};
