import type {
  Document,
  DocumentsListResponse,
  DocumentResponse,
  ListDocumentsQueryDto,
} from "@repo/shared";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

export const documentTypeSchema = z.enum([
  "bill_of_lading",
  "proof_of_delivery",
  "rate_confirmation",
  "driver_license",
]);

export const documentStatusSchema = z.enum([
  "complete",
  "processing",
  "needs_review",
]);

export const documentSchema: z.ZodType<Document> = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  fileSize: z.number().int().nonnegative(),
  fileUrl: z.string().nullable(),
  mimeType: z.string().nullable(),
  pageCount: z.number().int().positive().nullable(),
  extractionModel: z.string().nullable(),
  processingTimeMs: z.number().int().nonnegative().nullable(),
  type: documentTypeSchema,
  status: documentStatusSchema,
  uploadedBy: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable(),
  driver: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable(),
  load: z
    .object({
      id: z.string().uuid(),
      referenceNumber: z.string(),
    })
    .nullable(),
  uploadedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const documentsListResponseSchema: z.ZodType<DocumentsListResponse> = z.object({
  success: z.literal(true),
  data: z.array(documentSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

const documentResponseSchema: z.ZodType<DocumentResponse> = z.object({
  success: z.literal(true),
  data: documentSchema,
});

const toSearchParams = (filters: ListDocumentsQueryDto): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.driverId) params.set("driverId", filters.driverId);
  if (filters.loadId) params.set("loadId", filters.loadId);
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  return params;
};

export const fetchDocuments = async (
  filters: ListDocumentsQueryDto,
): Promise<DocumentsListResponse> => {
  const response = await fetch(`/api/documents?${toSearchParams(filters)}`);
  if (!response.ok) throw new Error("Unable to load documents");
  return documentsListResponseSchema.parse(await response.json());
};

export const fetchDocument = async (documentId: string): Promise<Document> => {
  const response = await fetch(`/api/documents/${documentId}`);
  if (!response.ok) throw new Error("Unable to load document");
  return documentResponseSchema.parse(await response.json()).data;
};

export const documentsQueryOptions = (filters: ListDocumentsQueryDto) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryKey: ["documents", filters],
    queryFn: () => fetchDocuments(filters),
  });

export const documentQueryOptions = (documentId: string) =>
  queryOptions({
    queryKey: ["documents", documentId],
    queryFn: () => fetchDocument(documentId),
  });
