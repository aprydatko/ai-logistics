const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001/api";
const uploadsBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

export const resolveDocumentFileUrl = (
  fileUrl: string | null | undefined,
): string | undefined => {
  if (!fileUrl) return undefined;
  if (
    fileUrl.startsWith("data:") ||
    fileUrl.startsWith("http://") ||
    fileUrl.startsWith("https://")
  ) {
    return fileUrl;
  }

  if (fileUrl.startsWith("/uploads/")) {
    return `/api/document-files${fileUrl.replace("/uploads", "")}`;
  }

  if (fileUrl.startsWith("uploads/")) {
    return `/api/document-files/${fileUrl.slice("uploads/".length)}`;
  }

  return `${uploadsBaseUrl}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
};
