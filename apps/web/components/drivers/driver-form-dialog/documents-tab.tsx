"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import * as React from "react";

import {
  addDriverDocument,
  deleteDriverDocument,
  type DriverDocumentInput,
} from "@/lib/drivers/driver-mutations";
import { resolveDocumentFileUrl } from "@/lib/documents/document-file-url";
import type { DriverDetails } from "@/lib/drivers/drivers-query";
import { Button } from "@repo/ui/components/button";
import { DatePicker } from "@repo/ui/components/date-picker";
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

const validateDocumentFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) return "Document must be 5 MB or smaller";
  if (!allowedMimeTypes.has(file.type)) {
    return "Upload a PDF, JPEG, PNG, or WebP file";
  }
  return null;
};

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
  pendingDocument,
  onPendingDocumentChange,
}: {
  details?: DriverDetails;
  driverId?: string;
  pendingDocument: DriverDocumentInput | null;
  onPendingDocumentChange: (document: DriverDocumentInput | null) => void;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [type, setType] =
    React.useState<DriverDocumentInput["type"]>("license");
  const [documentNumber, setDocumentNumber] = React.useState("");
  const [issuedAt, setIssuedAt] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [fileError, setFileError] = React.useState<string | null>(null);
  const refreshDetails = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ["drivers", driverId] });
  };
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select a file first");
      const validationError = validateDocumentFile(file);
      if (validationError) throw new Error(validationError);

      const document: DriverDocumentInput = {
        type,
        name: file.name,
        documentNumber: documentNumber || undefined,
        mimeType: file.type,
        content: await fileToBase64(file),
        issuedAt: issuedAt || undefined,
        expiresAt: expiresAt || undefined,
      };

      if (!driverId) {
        onPendingDocumentChange(document);
        return;
      }

      await addDriverDocument({ driverId, document });
    },
    onError: (error) =>
      toast.error("Unable to upload document", {
        description: error.message,
      }),
    onSuccess: async () => {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setType("license");
      setDocumentNumber("");
      setIssuedAt("");
      setExpiresAt("");
      setFileError(null);
      if (driverId) {
        await refreshDetails();
        toast.success("Document uploaded");
      } else {
        toast.success("Document ready", {
          description: "Save the driver to upload this document.",
        });
      }
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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface-100/40 p-4">
        <h3 className="font-bold text-ink-900">Upload document</h3>
        {!driverId ? (
          <p className="mt-1 text-sm text-primary-700">
            Select a document now. It will be uploaded when you save the driver.
          </p>
        ) : null}
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
            <Label>Issued date</Label>
            <DatePicker
              className="mt-2"
              onChange={setIssuedAt}
              placeholder="Select issued date"
              toDate={expiresAt ? new Date(`${expiresAt}T00:00:00`) : undefined}
              value={issuedAt}
            />
          </div>
          <div>
            <Label>Expiration date</Label>
            <DatePicker
              className="mt-2"
              fromDate={issuedAt ? new Date(`${issuedAt}T00:00:00`) : undefined}
              onChange={setExpiresAt}
              placeholder="Select expiration date"
              value={expiresAt}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>File (max 5 MB)</Label>
            <button
              aria-describedby={fileError ? "driver-document-error" : undefined}
              aria-invalid={Boolean(fileError)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary-700/35 bg-white px-4 py-5 text-sm font-semibold text-primary-700 transition hover:border-primary-700 hover:bg-surface-100 aria-invalid:border-danger aria-invalid:text-danger"
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
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                const validationError = selectedFile
                  ? validateDocumentFile(selectedFile)
                  : null;
                setFile(validationError ? null : selectedFile);
                setFileError(validationError);
                if (validationError) event.target.value = "";
              }}
              ref={fileInputRef}
              type="file"
            />
            {fileError ? (
              <p
                className="mt-2 text-xs text-danger"
                id="driver-document-error"
              >
                {fileError}
              </p>
            ) : null}
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
          {driverId ? "Upload" : "Attach document"}
        </Button>
        {pendingDocument ? (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-white p-3">
            <FileText className="size-5 shrink-0 text-primary-700" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {pendingDocument.name}
              </p>
              <p className="text-xs text-primary-700">
                Ready to upload after saving the driver
              </p>
            </div>
            <Button
              aria-label={`Remove ${pendingDocument.name}`}
              onClick={() => onPendingDocumentChange(null)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Trash2 className="size-4 text-danger" />
            </Button>
          </div>
        ) : null}
      </section>

      {driverId ? (
        <section>
          <h3 className="font-bold text-ink-900">Saved documents</h3>
          {!details?.documents.length ? (
            <p className="mt-3 text-sm text-primary-700">No documents yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-white px-4">
              {details.documents.map((document) => (
                <div className="flex items-center gap-3 py-3" key={document.id}>
                  {(() => {
                    const resolvedFileUrl = resolveDocumentFileUrl(
                      document.fileUrl,
                    );
                    return (
                      <>
                        <FileText className="size-5 text-primary-700" />
                        <div className="min-w-0 flex-1">
                          <a
                            className="block truncate font-semibold text-info hover:underline"
                            href={resolvedFileUrl}
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
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
};
