"use client";

import type {
  Document,
  DocumentStatus,
  DocumentType,
  UpdateDocumentDto,
} from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { updateDocument } from "@/lib/documents/document-mutations";
import { driverCandidatesQueryOptions } from "@/lib/drivers/driver-candidates-query";
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
  const driversQuery = useQuery(driverCandidatesQueryOptions);
  const loadsQuery = useQuery(
    loadsQueryOptions({ search: "", status: "all", pickupFrom: "", pickupTo: "", page: 1, limit: 100 }),
  );
  const [values, setValues] = useState<UpdateDocumentDto>({});
  const mutation = useMutation({
    mutationFn: updateDocument,
    onError: (error) =>
      toast.error("Unable to update document", { description: error.message }),
    onSuccess: async (updatedDocument) => {
      onOpenChange(false);
      queryClient.setQueryData(
        ["documents", updatedDocument.id],
        updatedDocument,
      );
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
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

  return (
    <Dialog open={document !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="px-7 pt-6 pr-14">
          <DialogTitle>Edit document</DialogTitle>
          <DialogDescription>
            Update document classification and linked records.
          </DialogDescription>
        </div>
        <div className="grid gap-5 px-7 py-5">
          <div className="grid gap-2">
            <Label>Document type</Label>
            <SelectButton
              onValueChange={(type) =>
                setValues((current) => ({
                  ...current,
                  type: type as DocumentType,
                }))
              }
              options={(Object.entries(documentTypeLabels) as Array<
                [DocumentType, string]
              >).map(([value, label]) => ({ label, value }))}
              placeholder="Document type"
              value={values.type}
            />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <SelectButton
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
          <div className="grid gap-2">
            <Label>Driver</Label>
            <SelectButton
              onValueChange={(driverId) =>
                setValues((current) => ({
                  ...current,
                  driverId: driverId === "unassigned" ? null : driverId,
                }))
              }
              options={[
                { label: "Unassigned", value: "unassigned" },
                ...(driversQuery.data ?? []).map((driver) => ({
                  label: `${driver.firstName} ${driver.lastName}`,
                  value: driver.id,
                })),
              ]}
              placeholder="Driver"
              value={values.driverId ?? "unassigned"}
            />
          </div>
          <div className="grid gap-2">
            <Label>Load</Label>
            <SelectButton
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
        <div className="flex justify-end gap-3 border-t px-7 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={!document || mutation.isPending}
            onClick={() => {
              if (document) {
                mutation.mutate({ documentId: document.id, updates: values });
              }
            }}
            type="button"
          >
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
