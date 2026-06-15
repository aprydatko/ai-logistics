"use client";

import type {
  CreateDocumentDto,
  DocumentStatus,
  DocumentType,
} from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import * as React from "react";

import { createDocument } from "@/lib/documents/document-mutations";
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
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { SelectButton } from "@repo/ui/components/select-button";
import { toast } from "@repo/ui/components/toaster";

import { documentTypeLabels } from "./types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const statusOptions: Array<{ label: string; value: DocumentStatus }> = [
  { label: "Complete", value: "complete" },
  { label: "Processing", value: "processing" },
  { label: "Needs review", value: "needs_review" },
];

export const DocumentCreateDialog = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const driversQuery = useQuery(driverCandidatesQueryOptions);
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
  const [file, setFile] = React.useState<File | null>(null);
  const [type, setType] = React.useState<DocumentType>("bill_of_lading");
  const [status, setStatus] = React.useState<DocumentStatus>("processing");
  const [driverId, setDriverId] = React.useState("unassigned");
  const [loadId, setLoadId] = React.useState("unassigned");
  const mutation = useMutation({
    mutationFn: (document: CreateDocumentDto) => createDocument(document),
    onError: (error) =>
      toast.error("Unable to add document", { description: error.message }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      onOpenChange(false);
      toast.success("Document added");
    },
  });
  const resetMutation = mutation.reset;

  React.useEffect(() => {
    if (!isOpen) return;
    setFile(null);
    setType("bill_of_lading");
    setStatus("processing");
    setDriverId("unassigned");
    setLoadId("unassigned");
    resetMutation();
  }, [isOpen, resetMutation]);

  const submit = (): void => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Document must be 5 MB or smaller");
      return;
    }
    mutation.mutate({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      type,
      status,
      driverId: driverId === "unassigned" ? undefined : driverId,
      loadId: loadId === "unassigned" ? undefined : loadId,
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="flex max-h-[calc(100svh-2rem)] max-w-xl flex-col">
        <div className="shrink-0 px-7 pt-7 pr-16 sm:px-9 sm:pt-8 sm:pr-16">
          <DialogTitle>Add document</DialogTitle>
          <DialogDescription className="mt-2 text-base">
            Add a file and link it to a driver or load.
          </DialogDescription>
        </div>
        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-7 py-7 sm:gap-6 sm:px-9">
          <div className="grid gap-2.5">
            <Label htmlFor="document-file">File (max 5 MB)</Label>
            <Input
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="h-12 cursor-pointer rounded-lg border-border bg-card px-3 py-2 text-sm file:mr-3 file:h-7 file:cursor-pointer file:rounded-md file:bg-surface-100 file:px-3 file:font-semibold"
              id="document-file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              type="file"
            />
          </div>
          <div className="grid gap-2.5">
            <Label>Document type</Label>
            <SelectButton
              className="h-12 w-full"
              onValueChange={(value) => setType(value as DocumentType)}
              options={(
                Object.entries(documentTypeLabels) as Array<
                  [DocumentType, string]
                >
              ).map(([value, label]) => ({ label, value }))}
              placeholder="Document type"
              value={type}
            />
          </div>
          <div className="grid gap-2.5">
            <Label>Status</Label>
            <SelectButton
              className="h-12 w-full"
              onValueChange={(value) => setStatus(value as DocumentStatus)}
              options={statusOptions}
              placeholder="Status"
              value={status}
            />
          </div>
          <div className="grid gap-2.5">
            <Label>Driver</Label>
            <SelectButton
              className="h-12 w-full"
              onValueChange={setDriverId}
              options={[
                { label: "Unassigned", value: "unassigned" },
                ...(driversQuery.data ?? []).map((driver) => ({
                  label: `${driver.firstName} ${driver.lastName}`,
                  value: driver.id,
                })),
              ]}
              placeholder="Driver"
              value={driverId}
            />
          </div>
          <div className="grid gap-2.5">
            <Label>Load</Label>
            <SelectButton
              className="h-12 w-full"
              onValueChange={setLoadId}
              options={[
                { label: "Unassigned", value: "unassigned" },
                ...(loadsQuery.data?.data ?? []).map((load) => ({
                  label: load.referenceNumber,
                  value: load.id,
                })),
              ]}
              placeholder="Load"
              value={loadId}
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
            disabled={!file || mutation.isPending}
            onClick={submit}
            type="button"
          >
            <Upload />
            {mutation.isPending ? "Adding..." : "Add document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
