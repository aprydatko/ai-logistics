import type {
  Document,
  DocumentAuditEvent,
  DocumentFileAccessResponse,
  DocumentExtractedField,
  DocumentsListResponse,
  DocumentResponse,
  ListDocumentsQueryDto,
} from "@repo/shared";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
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

const documentExtractedFieldStatusSchema = z.enum([
  "extracted",
  "edited",
  "confirmed",
  "rejected",
  "missing",
]);

const documentExtractedFieldSchema: z.ZodType<DocumentExtractedField> =
  z.object({
    id: z.string().uuid(),
    fieldKey: z.string(),
    label: z.string(),
    rawValue: z.string().nullable(),
    normalizedValue: z.string().nullable(),
    confidence: z.number().int().min(0).max(100).nullable(),
    status: documentExtractedFieldStatusSchema,
    extractedAt: z.string(),
    reviewedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  });

const documentAuditEventToneSchema = z.enum(["green", "navy", "violet"]);
const documentAuditEventKindSchema = z.enum([
  "uploaded",
  "ai_extraction",
  "load_link",
  "driver_link",
  "custom",
]);

const documentAuditEventSchema: z.ZodType<DocumentAuditEvent> = z.object({
  id: z.string().uuid(),
  kind: documentAuditEventKindSchema,
  label: z.string(),
  actor: z.string(),
  actorBadge: z.string(),
  role: z.string(),
  tone: documentAuditEventToneSchema,
  timestamp: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const documentSchema: z.ZodType<Document> = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  fileSize: z.number().int().nonnegative(),
  fileUrl: z.string().nullable(),
  mimeType: z.string().nullable(),
  storage: z.object({
    provider: z.enum(["local", "s3"]),
    bucket: z.string().nullable(),
    objectKey: z.string().nullable(),
    etag: z.string().nullable(),
  }),
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
  extractedFields: z.array(documentExtractedFieldSchema),
  auditEvents: z.array(documentAuditEventSchema),
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

const documentFileAccessResponseSchema: z.ZodType<DocumentFileAccessResponse> =
  z.object({
    success: z.literal(true),
    data: z.object({
      url: z.string().min(1),
      expiresAt: z.string(),
    }),
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

export const fetchDocumentFileAccess = async (
  documentId: string,
): Promise<DocumentFileAccessResponse["data"]> => {
  const response = await fetch(`/api/documents/${documentId}/file-access`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to load document file");
  return documentFileAccessResponseSchema.parse(await response.json()).data;
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

export const documentFileAccessQueryOptions = (documentId: string) =>
  queryOptions({
    queryKey: ["documents", documentId, "file-access"],
    queryFn: () => fetchDocumentFileAccess(documentId),
    staleTime: 60_000,
  });

export const updateDocumentInLists = (
  current: DocumentsListResponse | undefined,
  nextDocument: Document,
): DocumentsListResponse | undefined => {
  if (!current) return current;
  if (!Array.isArray(current.data)) return current;

  return {
    ...current,
    data: current.data.map((document) =>
      document.id === nextDocument.id ? nextDocument : document,
    ),
  };
};

export const removeDocumentFromLists = (
  current: DocumentsListResponse | undefined,
  documentId: string,
): DocumentsListResponse | undefined => {
  if (!current) return current;
  if (!Array.isArray(current.data)) return current;

  return {
    ...current,
    data: current.data.filter((document) => document.id !== documentId),
  };
};

export const syncDocumentCache = (
  queryClient: QueryClient,
  document: Document,
): void => {
  queryClient.setQueriesData(
    { queryKey: ["documents"] },
    (current: DocumentsListResponse | undefined) =>
      updateDocumentInLists(current, document),
  );
  queryClient.setQueryData(["documents", document.id], document);
};

export const removeDocumentCache = (
  queryClient: QueryClient,
  documentId: string,
): void => {
  queryClient.setQueriesData(
    { queryKey: ["documents"] },
    (current: DocumentsListResponse | undefined) =>
      removeDocumentFromLists(current, documentId),
  );
  queryClient.removeQueries({ queryKey: ["documents", documentId] });
};
