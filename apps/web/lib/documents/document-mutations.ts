import type {
  CreateDocumentDto,
  DeleteDocumentResponse,
  Document,
  DocumentResponse,
  ReplaceDocumentAuditEventsDto,
  ReplaceDocumentExtractedFieldsDto,
  UpdateDocumentDto,
} from "@repo/shared";
import { z } from "zod";

import { documentSchema } from "./documents-query";

const documentResponseSchema: z.ZodType<DocumentResponse> = z.object({
  success: z.literal(true),
  data: documentSchema,
});

const deleteDocumentResponseSchema: z.ZodType<DeleteDocumentResponse> =
  z.object({
    success: z.literal(true),
    data: z.object({ id: z.string().uuid() }),
  });

type ApiErrorBody = {
  message?: string;
};

export const extractDocumentApiError = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  if (!body || typeof body !== "object") return fallback;

  const { message } = body as ApiErrorBody;
  return typeof message === "string" ? message : fallback;
};

export const updateDocument = async ({
  documentId,
  updates,
}: {
  documentId: string;
  updates: UpdateDocumentDto;
}): Promise<Document> => {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(
      await extractDocumentApiError(response, "Unable to update document"),
    );
  }
  return documentResponseSchema.parse(await response.json()).data;
};

export const createDocument = async (
  document: CreateDocumentDto,
): Promise<Document> => {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(document),
  });
  if (!response.ok) {
    throw new Error(
      await extractDocumentApiError(response, "Unable to add document"),
    );
  }
  return documentResponseSchema.parse(await response.json()).data;
};

export const uploadDocument = async ({
  analyzeWithVision,
  driverId,
  file,
  loadId,
  type,
}: {
  analyzeWithVision?: boolean;
  driverId?: string;
  file: File;
  loadId?: string;
  type:
    | "bill_of_lading"
    | "proof_of_delivery"
    | "rate_confirmation"
    | "driver_license";
}): Promise<Document> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  formData.append("analyzeWithVision", analyzeWithVision ? "true" : "false");
  if (driverId) formData.append("driverId", driverId);
  if (loadId) formData.append("loadId", loadId);

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(
      await extractDocumentApiError(response, "Unable to upload document"),
    );
  }
  return documentResponseSchema.parse(await response.json()).data;
};

export const replaceDocumentExtractedFields = async ({
  documentId,
  fields,
}: {
  documentId: string;
  fields: ReplaceDocumentExtractedFieldsDto["fields"];
}): Promise<Document> => {
  const response = await fetch(
    `/api/documents/${documentId}/extracted-fields`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    },
  );
  if (!response.ok) {
    throw new Error(
      await extractDocumentApiError(
        response,
        "Unable to save extracted fields",
      ),
    );
  }
  return documentResponseSchema.parse(await response.json()).data;
};

export const replaceDocumentAuditEvents = async ({
  documentId,
  events,
}: {
  documentId: string;
  events: ReplaceDocumentAuditEventsDto["events"];
}): Promise<Document> => {
  const response = await fetch(`/api/documents/${documentId}/audit-events`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  });
  if (!response.ok) {
    throw new Error(
      await extractDocumentApiError(response, "Unable to save audit events"),
    );
  }
  return documentResponseSchema.parse(await response.json()).data;
};

export const deleteDocument = async (
  documentId: string,
): Promise<DeleteDocumentResponse["data"]> => {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(
      await extractDocumentApiError(response, "Unable to delete document"),
    );
  }
  return deleteDocumentResponseSchema.parse(await response.json()).data;
};
