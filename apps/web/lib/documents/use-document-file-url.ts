"use client";

import type { Document } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";

import { documentFileAccessQueryOptions } from "./documents-query";
import { resolveDocumentFileUrl } from "./document-file-url";

export const useDocumentFileUrl = (document: Document): string | undefined => {
  const fallbackUrl = resolveDocumentFileUrl(document.fileUrl);
  const accessQuery = useQuery({
    ...documentFileAccessQueryOptions(document.id),
    retry: 1,
  });

  return accessQuery.data?.url ?? fallbackUrl;
};
