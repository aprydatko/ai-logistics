import type {
  DeleteDocumentResponse,
  Document,
  DocumentResponse,
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
