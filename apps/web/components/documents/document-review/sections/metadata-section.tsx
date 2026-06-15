"use client";

import type { Document } from "@repo/shared";

import { formatDocumentFileSize } from "../../types";
import { formatProcessingTime, formatUploadedAt } from "../review-data";

export const MetadataSection = ({
  document,
}: {
  document: Document;
}): React.JSX.Element => (
  <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
    <h2 className="text-base font-semibold">Metadata</h2>
    <dl className="mt-4 grid gap-x-7 gap-y-2 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
      {[
        ["File name", document.fileName],
        [
          "Owner",
          document.uploadedBy
            ? `${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`
            : "Not available",
        ],
        ["File size", formatDocumentFileSize(document.fileSize)],
        ["Uploaded at", formatUploadedAt(document.uploadedAt)],
        ["File type", document.mimeType ?? "Unknown"],
        ["AI model", document.extractionModel ?? "Not available"],
        ["Pages", document.pageCount?.toString() ?? "Not available"],
        ["Processing time", formatProcessingTime(document.processingTimeMs)],
      ].map(([label, value]) => (
        <div className="contents" key={label}>
          <dt className="text-ink-500">{label}</dt>
          <dd className="font-medium text-primary-700">{value}</dd>
        </div>
      ))}
    </dl>
  </section>
);
