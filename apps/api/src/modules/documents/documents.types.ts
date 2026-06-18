import type {
  DocumentAuditEventRecord,
  DocumentExtractedFieldRecord,
  DocumentRecord,
  DocumentUploadRecord,
} from "../../db/schema";

export type DocumentAuditEventItem = Omit<
  DocumentAuditEventRecord,
  "createdAt" | "documentId" | "eventAt" | "updatedAt"
> & {
  timestamp: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentExtractedFieldItem = Omit<
  DocumentExtractedFieldRecord,
  "createdAt" | "extractedAt" | "reviewedAt" | "updatedAt"
> & {
  extractedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentItem = Omit<
  DocumentRecord,
  | "createdAt"
  | "driverId"
  | "fileUrl"
  | "loadId"
  | "etag"
  | "objectKey"
  | "storagePath"
  | "storageBucket"
  | "storageProvider"
  | "updatedAt"
  | "uploadedAt"
  | "uploadedByUserId"
> & {
  fileUrl: string | null;
  mimeType: string | null;
  storage: {
    provider: DocumentRecord["storageProvider"];
    bucket: string | null;
    objectKey: string | null;
    etag: string | null;
  };
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  load: {
    id: string;
    referenceNumber: string;
  } | null;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
  extractedFields: DocumentExtractedFieldItem[];
  auditEvents: DocumentAuditEventItem[];
};

export type DocumentsListResult = {
  success: true;
  data: DocumentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DocumentResult = { success: true; data: DocumentItem };
export type DocumentUploadSessionResult = {
  success: true;
  data: {
    id: DocumentUploadRecord["id"];
    status: DocumentUploadRecord["status"];
    uploadUrl: string;
    objectKey: string;
    expiresAt: string;
  };
};
export type DocumentFileAccessResult = {
  success: true;
  data: {
    url: string;
    expiresAt: string;
  };
};
export type DeleteDocumentResult = {
  success: true;
  data: { id: string };
};
