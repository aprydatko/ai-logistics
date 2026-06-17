import type { Document } from "@repo/shared";
import { Check, LoaderCircle, Pencil } from "lucide-react";

import { Button } from "@repo/ui/components/button";

const formatConfidence = (confidence: number | null): string =>
  confidence === null ? "—" : `${confidence}%`;

const getFieldValue = (
  documentField: Document["extractedFields"][number],
): string => documentField.normalizedValue ?? documentField.rawValue ?? "—";

export const ExtractedFieldsSection = ({
  document,
}: {
  document: Document;
}): React.JSX.Element => {
  const isProcessing = document.status === "processing";

  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold">Extracted fields</h2>
        <span className="ml-4 flex items-center gap-1.5 text-xs font-medium text-ink-700">
          <Check className="size-4 rounded-full bg-emerald-500 p-0.5 text-white" />
          {document.extractedFields.length} fields extracted
        </span>
        <Button className="ml-auto" size="sm" variant="outline">
          <Pencil /> Edit
        </Button>
      </div>
      {document.extractedFields.length === 0 ? (
        isProcessing ? (
          <div className="flex items-start gap-3 px-5 py-6 text-sm text-ink-500">
            <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-info" />
            <div className="space-y-1">
              <p className="font-medium text-ink-900">
                Fields are being extracted
              </p>
              <p>
                Background processing is still running. Extracted values will
                appear here automatically when the job completes.
              </p>
            </div>
          </div>
        ) : (
          <div className="px-5 py-6 text-sm text-ink-500">
            No extracted fields are available for this document yet.
          </div>
        )
      ) : (
        <dl className="grid grid-cols-[minmax(110px,1fr)_minmax(170px,1fr)_auto] gap-x-4 gap-y-2 px-5 py-4 text-sm">
          {document.extractedFields.map((field) => {
            const confidence = formatConfidence(field.confidence);

            return (
              <div className="contents" key={field.id}>
                <dt className="text-ink-500">{field.label}</dt>
                <dd className="font-medium text-primary-700">
                  {getFieldValue(field)}
                </dd>
                <dd
                  className={
                    confidence === "—"
                      ? "text-ink-500"
                      : "rounded-full bg-success-background px-2 py-0.5 text-xs font-semibold text-success"
                  }
                >
                  {confidence}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
};
