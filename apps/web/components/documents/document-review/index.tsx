"use client";

import { useQuery } from "@tanstack/react-query";

import { documentQueryOptions } from "@/lib/documents/documents-query";

import { DocumentReviewContent } from "./document-review-content";

export const DocumentReview = ({
  documentId,
}: {
  documentId: string;
}): React.JSX.Element => {
  const query = useQuery(documentQueryOptions(documentId));

  if (query.isPending) {
    return <div className="p-10 text-center">Loading document...</div>;
  }

  if (query.isError) {
    return (
      <div className="p-10 text-center">
        Unable to load this document. It may have been deleted.
      </div>
    );
  }

  return <DocumentReviewContent document={query.data} />;
};
