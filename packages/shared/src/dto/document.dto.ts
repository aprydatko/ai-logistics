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

export type UpdateDocumentDto = Partial<
  Pick<Document, "type" | "status">
> & {
  driverId?: string | null;
  loadId?: string | null;
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
