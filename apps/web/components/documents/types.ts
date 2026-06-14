export type DocumentStatus = "complete" | "processing" | "needs_review";

export interface DocumentRowData {
  id: string;
  fileName: string;
  fileSize: string;
  type: string;
  driver: string;
  load: string;
  status: DocumentStatus;
  uploadedAt: string;
}

export interface DocumentFilters {
  search: string;
  driver: string | "all";
  type: string | "all";
  status: DocumentStatus | "all";
}
