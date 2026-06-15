"use client";

import type { Document } from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Save } from "lucide-react";

import { updateDocument } from "@/lib/documents/document-mutations";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/toaster";

type MetadataDraft = Pick<
  Document,
  "fileName" | "mimeType" | "extractionModel" | "pageCount" | "processingTimeMs"
>;

export const MetadataForm = ({
  documentId,
  value,
  onChange,
  onSaved,
}: {
  documentId: string;
  value: MetadataDraft;
  onChange: (value: MetadataDraft) => void;
  onSaved: (document: Document) => void;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      updateDocument({
        documentId,
        updates: {
          fileName: value.fileName,
          mimeType: value.mimeType,
          extractionModel: value.extractionModel,
          pageCount: value.pageCount,
          processingTimeMs: value.processingTimeMs,
        },
      }),
    onError: (error) =>
      toast.error("Unable to save metadata", {
        description: error.message,
      }),
    onSuccess: async (updatedDocument) => {
      queryClient.setQueryData(
        ["documents", updatedDocument.id],
        updatedDocument,
      );
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      onSaved(updatedDocument);
      toast.success("Metadata saved");
    },
  });

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Edit metadata</h2>
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
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink-700">File name</span>
          <input
            className="rounded-md border border-border px-3 py-2 outline-none ring-0 placeholder:text-ink-400 focus:border-info"
            onChange={(event) =>
              onChange({ ...value, fileName: event.target.value })
            }
            value={value.fileName}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink-700">File type</span>
          <input
            className="rounded-md border border-border px-3 py-2 outline-none ring-0 placeholder:text-ink-400 focus:border-info"
            onChange={(event) =>
              onChange({ ...value, mimeType: event.target.value || null })
            }
            value={value.mimeType ?? ""}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink-700">AI model</span>
          <input
            className="rounded-md border border-border px-3 py-2 outline-none ring-0 placeholder:text-ink-400 focus:border-info"
            onChange={(event) =>
              onChange({
                ...value,
                extractionModel: event.target.value || null,
              })
            }
            value={value.extractionModel ?? ""}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink-700">Pages</span>
          <input
            className="rounded-md border border-border px-3 py-2 outline-none ring-0 placeholder:text-ink-400 focus:border-info"
            min={1}
            onChange={(event) =>
              onChange({
                ...value,
                pageCount: event.target.value
                  ? Number(event.target.value)
                  : null,
              })
            }
            type="number"
            value={value.pageCount ?? ""}
          />
        </label>
        <label className="grid gap-1.5 text-sm md:col-span-2">
          <span className="font-medium text-ink-700">Processing time (ms)</span>
          <input
            className="rounded-md border border-border px-3 py-2 outline-none ring-0 placeholder:text-ink-400 focus:border-info"
            min={0}
            onChange={(event) =>
              onChange({
                ...value,
                processingTimeMs: event.target.value
                  ? Number(event.target.value)
                  : null,
              })
            }
            type="number"
            value={value.processingTimeMs ?? ""}
          />
        </label>
      </div>
    </section>
  );
};
