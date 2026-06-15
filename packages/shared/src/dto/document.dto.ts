import type {
  Document,
  DocumentStatus,
  DocumentType,
} from "../types/document.js";

export type ListDocumentsQueryDto = {
  search?: string;
  driverId?: string;
  loadId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  sortBy?: "uploadedAt" | "fileName" | "type" | "status" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type CreateDocumentDto = Pick<
  Document,
  "fileName" | "fileSize" | "mimeType" | "status" | "type"
> & {
  driverId?: string;
  loadId?: string;
};

export type UpdateDocumentDto = Partial<Pick<Document, "type" | "status">> & {
  fileName?: string;
  mimeType?: string | null;
  extractionModel?: string | null;
  pageCount?: number | null;
  processingTimeMs?: number | null;
  driverId?: string | null;
  loadId?: string | null;
};

export type UpdateDocumentExtractedFieldDto = {
  fieldKey: string;
  label: string;
  rawValue?: string | null;
  normalizedValue?: string | null;
  confidence?: number | null;
  status: Document["extractedFields"][number]["status"];
};

export type ReplaceDocumentExtractedFieldsDto = {
  fields: UpdateDocumentExtractedFieldDto[];
};

export type UpdateDocumentAuditEventDto = {
  kind: Document["auditEvents"][number]["kind"];
  label: string;
  actor: string;
  actorBadge: string;
  role: string;
  tone: Document["auditEvents"][number]["tone"];
  timestamp?: string | null;
};

export type ReplaceDocumentAuditEventsDto = {
  events: UpdateDocumentAuditEventDto[];
};

export type DocumentsListResponse = {
  success: true;
  data: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DocumentResponse = {
  success: true;
  data: Document;
};

export type DeleteDocumentResponse = {
  success: true;
  data: {
    id: string;
  };
};
