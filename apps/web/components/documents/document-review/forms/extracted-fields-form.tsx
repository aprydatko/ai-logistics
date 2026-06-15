"use client";

import type { Document, DocumentExtractedField } from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";

import { replaceDocumentExtractedFields } from "@/lib/documents/document-mutations";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/toaster";

const fieldStatuses: DocumentExtractedField["status"][] = [
  "extracted",
  "edited",
  "confirmed",
  "rejected",
  "missing",
];

const createEmptyField = (): DocumentExtractedField => {
  const now = new Date().toISOString();

  return {
    id: globalThis.crypto.randomUUID(),
    fieldKey: "",
    label: "",
    rawValue: null,
    normalizedValue: null,
    confidence: null,
    status: "extracted",
    extractedAt: now,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now,
  };
};

export const ExtractedFieldsForm = ({
  documentId,
  fields,
  onChange,
  onSaved,
}: {
  documentId: string;
  fields: Document["extractedFields"];
  onChange: (fields: Document["extractedFields"]) => void;
  onSaved: (document: Document) => void;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      replaceDocumentExtractedFields({
        documentId,
        fields: fields.map((field) => ({
          fieldKey: field.fieldKey,
          label: field.label,
          rawValue: field.rawValue,
          normalizedValue: field.normalizedValue,
          confidence: field.confidence,
          status: field.status,
        })),
      }),
    onError: (error) =>
      toast.error("Unable to save extracted fields", {
        description: error.message,
      }),
    onSuccess: async (updatedDocument) => {
      queryClient.setQueryData(
        ["documents", updatedDocument.id],
        updatedDocument,
      );
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      onSaved(updatedDocument);
      toast.success("Extracted fields saved");
    },
  });

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Edit extracted fields</h2>
          <span className="text-sm text-ink-500">
            {fields.length} editable rows
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onChange([...fields, createEmptyField()])}
            type="button"
            variant="outline"
          >
            <Plus />
            Add field
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            type="button"
          >
            {mutation.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Save />
            )}
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {fields.length === 0 ? (
          <p className="text-sm text-ink-500">
            No extracted fields are available for editing yet.
          </p>
        ) : null}
        {fields.map((field, index) => (
          <div
            className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-2"
            key={field.id}
          >
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">Label</span>
              <input
                className="rounded-md border border-border px-3 py-2 focus:border-info"
                onChange={(event) =>
                  onChange(
                    fields.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, label: event.target.value }
                        : item,
                    ),
                  )
                }
                value={field.label}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">Field key</span>
              <input
                className="rounded-md border border-border px-3 py-2 focus:border-info"
                onChange={(event) =>
                  onChange(
                    fields.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, fieldKey: event.target.value }
                        : item,
                    ),
                  )
                }
                value={field.fieldKey}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">Raw value</span>
              <input
                className="rounded-md border border-border px-3 py-2 focus:border-info"
                onChange={(event) =>
                  onChange(
                    fields.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, rawValue: event.target.value || null }
                        : item,
                    ),
                  )
                }
                value={field.rawValue ?? ""}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">Normalized value</span>
              <input
                className="rounded-md border border-border px-3 py-2 focus:border-info"
                onChange={(event) =>
                  onChange(
                    fields.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            normalizedValue: event.target.value || null,
                          }
                        : item,
                    ),
                  )
                }
                value={field.normalizedValue ?? ""}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">Confidence</span>
              <input
                className="rounded-md border border-border px-3 py-2 focus:border-info"
                max={100}
                min={0}
                onChange={(event) =>
                  onChange(
                    fields.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            confidence: event.target.value
                              ? Number(event.target.value)
                              : null,
                          }
                        : item,
                    ),
                  )
                }
                type="number"
                value={field.confidence ?? ""}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-ink-700">Status</span>
                <select
                  className="rounded-md border border-border px-3 py-2 focus:border-info"
                  onChange={(event) =>
                    onChange(
                      fields.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              status: event.target
                                .value as DocumentExtractedField["status"],
                            }
                          : item,
                      ),
                    )
                  }
                  value={field.status}
                >
                  {fieldStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                aria-label={`Remove field ${field.label || index + 1}`}
                className="self-end"
                onClick={() =>
                  onChange(fields.filter((_, itemIndex) => itemIndex !== index))
                }
                type="button"
                variant="outline"
              >
                <Trash2 />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
