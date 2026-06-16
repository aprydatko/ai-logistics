"use client";

import type { Document } from "@repo/shared";
import { ArrowLeft, Check, Download, Truck, UserRound } from "lucide-react";
import Link from "next/link";

import { resolveDocumentFileUrl } from "@/lib/documents/document-file-url";
import { Button } from "@repo/ui/components/button";

import { formatUploadedAt } from "./review-data";

export type DocumentReviewTab = "overview" | "metadata" | "fields" | "audit";

const tabs: Array<{ id: DocumentReviewTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "metadata", label: "Metadata" },
  { id: "fields", label: "Extracted fields" },
  { id: "audit", label: "Audit & links" },
];

const statusBadge = {
  complete: {
    className: "bg-success-background text-success",
    icon: Check,
    label: "Extraction complete",
  },
  processing: {
    className: "bg-info/10 text-info",
    icon: Check,
    label: "Extraction in progress",
  },
  needs_review: {
    className: "bg-warning/10 text-warning",
    icon: Check,
    label: "Needs review",
  },
} as const;

export const DocumentReviewHeader = ({
  document,
  activeTab,
  onTabChange,
}: {
  document: Document;
  activeTab: DocumentReviewTab;
  onTabChange: (tab: DocumentReviewTab) => void;
}): React.JSX.Element => {
  const resolvedFileUrl = resolveDocumentFileUrl(document.fileUrl);
  const badge = statusBadge[document.status];
  const BadgeIcon = badge.icon;

  return (
    <header className="border-b border-border bg-card px-5 pt-4 lg:px-7">
      <Link
        className="flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary"
        href="/documents"
      >
        <ArrowLeft className="size-4" /> Back to documents
      </Link>
      <div className="mt-4 flex flex-col justify-between gap-6 pb-5 xl:flex-row xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h1 text-ink-900">{document.fileName}</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
            >
              <BadgeIcon className="size-3.5" /> {badge.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Uploaded {formatUploadedAt(document.uploadedAt)}
          </p>
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid grid-cols-[auto_auto_1fr] gap-x-3 gap-y-1 border-l border-border pl-5 text-sm">
            <span className="col-span-3 mb-1 font-semibold text-ink-700">
              Linked to
            </span>
            <Truck className="size-4 text-info" />
            <span>Load</span>
            {document.load ? (
              <Link
                className="font-medium text-info hover:underline"
                href={`/loads/${document.load.id}`}
              >
                {document.load.referenceNumber}
              </Link>
            ) : (
              <span className="font-medium text-ink-500">Unassigned</span>
            )}
            <UserRound className="size-4 text-primary-700" />
            <span>Driver</span>
            {document.driver ? (
              <Link
                className="font-medium text-primary-700 hover:underline"
                href={`/drivers/${document.driver.id}`}
              >
                {`${document.driver.firstName} ${document.driver.lastName}`}
              </Link>
            ) : (
              <span className="font-medium text-ink-500">Unassigned</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button asChild className="h-10" variant="outline">
              <a download={document.fileName} href={resolvedFileUrl}>
                <Download /> Download
              </a>
            </Button>
          </div>
        </div>
      </div>
      <nav aria-label="Document views" className="flex gap-8">
        {tabs.map((tab) => (
          <button
            className={`border-b-2 px-1 pb-3 text-sm font-semibold ${
              activeTab === tab.id
                ? "border-info text-ink-900"
                : "border-transparent text-ink-500 hover:text-ink-900"
            }`}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
};
