"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import * as React from "react";

import {
  addDriverDocument,
  deleteDriverDocument,
  type DriverDocumentInput,
} from "@/lib/drivers/driver-mutations";
import type { DriverDetails } from "@/lib/drivers/drivers-query";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error("Unable to read the selected file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read the selected file"));
        return;
      }
      resolve(result.split(",")[1] ?? "");
    };
    reader.readAsDataURL(file);
  });

export const DocumentsTab = ({
  details,
  driverId,
}: {
  details?: DriverDetails;
  driverId?: string;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [type, setType] =
    React.useState<DriverDocumentInput["type"]>("license");
  const [documentNumber, setDocumentNumber] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const refreshDetails = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ["drivers", driverId] });
  };
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!driverId || !file) throw new Error("Select a file first");
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Document must be 5 MB or smaller");
      }
      if (!allowedMimeTypes.has(file.type)) {
        throw new Error("Upload a PDF, JPEG, PNG, or WebP file");
      }
      await addDriverDocument({
        driverId,
        document: {
          type,
          name: file.name,
          documentNumber: documentNumber || undefined,
          mimeType: file.type,
          content: await fileToBase64(file),
          expiresAt: expiresAt || undefined,
        },
      });
    },
    onError: (error) =>
      toast.error("Unable to upload document", {
        description: error.message,
      }),
    onSuccess: async () => {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setDocumentNumber("");
      setExpiresAt("");
      await refreshDetails();
      toast.success("Document uploaded");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      deleteDriverDocument({ driverId: driverId ?? "", documentId }),
    onError: (error) =>
      toast.error("Unable to delete document", {
        description: error.message,
      }),
    onSuccess: refreshDetails,
  });

  if (!driverId) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <FileText className="mx-auto size-9 text-primary-700/50" />
        <p className="mt-3 font-semibold">Save the driver first</p>
        <p className="mt-1 text-sm text-primary-700">
          Documents can be added after the driver profile is created.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface-100/40 p-4">
        <h3 className="font-bold text-ink-900">Upload document</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Document type</Label>
            <Select
              onValueChange={(value) =>
                setType(value as DriverDocumentInput["type"])
              }
              value={type}
            >
              <SelectTrigger className="mt-2 w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="license">License</SelectItem>
                <SelectItem value="medical_card">Medical card</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="document-number">Document number</Label>
            <Input
              className="mt-2 bg-white"
              id="document-number"
              onChange={(event) => setDocumentNumber(event.target.value)}
              value={documentNumber}
            />
          </div>
          <div>
            <Label htmlFor="document-expiration">Expiration date</Label>
            <Input
              className="mt-2 bg-white"
              id="document-expiration"
              onChange={(event) => setExpiresAt(event.target.value)}
              type="date"
              value={expiresAt}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>File (max 5 MB)</Label>
            <button
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary-700/35 bg-white px-4 py-5 text-sm font-semibold text-primary-700 transition hover:border-primary-700 hover:bg-surface-100"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Upload className="size-5" />
              {file ? file.name : "Choose PDF or image"}
            </button>
            <Input
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              id="driver-document"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              ref={fileInputRef}
              type="file"
            />
          </div>
        </div>
        <Button
          className="mt-4"
          disabled={!file || uploadMutation.isPending}
          onClick={() => uploadMutation.mutate()}
          type="button"
        >
          {uploadMutation.isPending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Upload />
          )}
          Upload
        </Button>
      </section>

      <section>
        <h3 className="font-bold text-ink-900">Saved documents</h3>
        {!details?.documents.length ? (
          <p className="mt-3 text-sm text-primary-700">No documents yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-white px-4">
            {details.documents.map((document) => (
              <div className="flex items-center gap-3 py-3" key={document.id}>
                <FileText className="size-5 text-primary-700" />
                <div className="min-w-0 flex-1">
                  <a
                    className="block truncate font-semibold text-info hover:underline"
                    href={document.fileUrl ?? undefined}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {document.name}
                  </a>
                  <p className="text-xs text-primary-700">
                    {document.documentNumber ??
                      document.type.replaceAll("_", " ")}
                    {document.expiresAt
                      ? ` · expires ${document.expiresAt}`
                      : ""}
                  </p>
                </div>
                <Button
                  aria-label={`Delete ${document.name}`}
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(document.id)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
