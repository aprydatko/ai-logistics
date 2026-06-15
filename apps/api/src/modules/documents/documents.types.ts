import type { DocumentRecord } from "../../db/schema";

export type DocumentItem = Omit<
  DocumentRecord,
  | "createdAt"
  | "driverId"
  | "loadId"
  | "updatedAt"
  | "uploadedAt"
  | "uploadedByUserId"
> & {
  fileUrl: string | null;
  mimeType: string | null;
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
export type DeleteDocumentResult = {
  success: true;
  data: { id: string };
};
