"use client";

import type {
  Document,
  DocumentStatus,
  DocumentType,
  UpdateDocumentDto,
} from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";

import { updateDocument } from "@/lib/documents/document-mutations";
import { syncDocumentCache } from "@/lib/documents/documents-query";
import { driversQueryOptions } from "@/lib/drivers/drivers-query";
import { loadsQueryOptions } from "@/lib/loads/loads-query";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { SelectButton } from "@repo/ui/components/select-button";
import { toast } from "@repo/ui/components/toaster";

import { documentTypeLabels } from "./types";

const statusOptions: Array<{ label: string; value: DocumentStatus }> = [
  { label: "Complete", value: "complete" },
  { label: "Processing", value: "processing" },
  { label: "Needs review", value: "needs_review" },
];

export const DocumentEditDialog = ({
  document,
  onOpenChange,
}: {
  document: Document | null;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const driversQuery = useQuery(
    driversQueryOptions({
      search: "",
      status: "all",
      isActive: "all",
      page: 1,
      limit: 100,
    }),
  );
  const loadsQuery = useQuery(
    loadsQueryOptions({
      search: "",
      status: "all",
      pickupFrom: "",
      pickupTo: "",
      page: 1,
      limit: 100,
    }),
  );
  const [values, setValues] = useState<UpdateDocumentDto>({});
  const mutation = useMutation({
    mutationFn: updateDocument,
    onError: (error) =>
      toast.error("Unable to update document", { description: error.message }),
    onSuccess: async (updatedDocument) => {
      onOpenChange(false);
      syncDocumentCache(queryClient, updatedDocument);
      toast.success("Document updated");
    },
  });
  const resetMutation = mutation.reset;

  useEffect(() => {
    if (!document) return;
    setValues({
      driverId: document.driver?.id ?? null,
      loadId: document.load?.id ?? null,
      status: document.status,
      type: document.type,
    });
    resetMutation();
  }, [document, resetMutation]);

  const isOpen = document !== null;

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] max-w-xl flex-col">
        <div className="shrink-0 px-7 pt-7 pr-16 sm:px-9 sm:pt-8 sm:pr-16">
          <DialogTitle>Edit document</DialogTitle>
          <DialogDescription className="mt-2 text-base">
            Update document classification and linked records.
          </DialogDescription>
        </div>
        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-7 py-7 sm:gap-6 sm:px-9">
          <div className="grid gap-2.5">
            <Label>Document type</Label>
            <SelectButton
              className="h-12 w-full"
              onValueChange={(type) =>
                setValues((current) => ({
                  ...current,
                  type: type as DocumentType,
                }))
              }
              options={(
                Object.entries(documentTypeLabels) as Array<
                  [DocumentType, string]
                >
              ).map(([value, label]) => ({ label, value }))}
              placeholder="Document type"
              value={values.type}
            />
          </div>
          <div className="grid gap-2.5">
            <Label>Status</Label>
            <SelectButton
              className="h-12 w-full"
              onValueChange={(status) =>
                setValues((current) => ({
                  ...current,
                  status: status as DocumentStatus,
                }))
              }
              options={statusOptions}
              placeholder="Status"
              value={values.status}
            />
          </div>
          <div className="grid gap-2.5">
            <Label>Driver</Label>
            <SelectButton
              className="h-12 w-full"
              onValueChange={(driverId) =>
                setValues((current) => ({
                  ...current,
                  driverId: driverId === "unassigned" ? null : driverId,
                }))
              }
              options={[
                { label: "Unassigned", value: "unassigned" },
                ...(driversQuery.data?.data ?? []).map((driver) => ({
                  label: `${driver.firstName} ${driver.lastName}`,
                  value: driver.id,
                })),
              ]}
              placeholder="Driver"
              value={values.driverId ?? "unassigned"}
            />
          </div>
          <div className="grid gap-2.5">
            <Label>Load</Label>
            <SelectButton
              className="h-12 w-full"
              onValueChange={(loadId) =>
                setValues((current) => ({
                  ...current,
                  loadId: loadId === "unassigned" ? null : loadId,
                }))
              }
              options={[
                { label: "Unassigned", value: "unassigned" },
                ...(loadsQuery.data?.data ?? []).map((load) => ({
                  label: load.referenceNumber,
                  value: load.id,
                })),
              ]}
              placeholder="Load"
              value={values.loadId ?? "unassigned"}
            />
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-surface-50/50 px-7 py-5 sm:px-9">
          <DialogClose asChild>
            <Button className="h-11 px-6" type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="h-11 px-6"
            disabled={!document || mutation.isPending}
            onClick={() => {
              if (document) {
                mutation.mutate({ documentId: document.id, updates: values });
              }
            }}
            type="button"
          >
            <Save />
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
