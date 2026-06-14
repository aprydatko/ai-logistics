import type {
  DocumentStatus,
  DocumentType,
  ListDocumentsQueryDto,
} from "@repo/shared";

export type DocumentFilters = {
  search: string;
  driverId: string | "all";
  type: DocumentType | "all";
  status: DocumentStatus | "all";
  page: number;
  limit: number;
};

export const documentTypeLabels: Record<DocumentType, string> = {
  bill_of_lading: "Bill of Lading",
  driver_license: "Driver License",
  proof_of_delivery: "Proof of Delivery",
  rate_confirmation: "Rate Confirmation",
};

export const formatDocumentType = (type: DocumentType): string =>
  documentTypeLabels[type];

export const formatDocumentFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
};

export const toDocumentsQuery = (
  filters: DocumentFilters,
  search: string,
): ListDocumentsQueryDto => ({
  search: search || undefined,
  driverId: filters.driverId === "all" ? undefined : filters.driverId,
  type: filters.type === "all" ? undefined : filters.type,
  status: filters.status === "all" ? undefined : filters.status,
  sortBy: "uploadedAt",
  sortOrder: "desc",
  page: filters.page,
  limit: filters.limit,
});
