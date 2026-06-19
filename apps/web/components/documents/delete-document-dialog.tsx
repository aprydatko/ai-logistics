"use client";

import type { Document } from "@repo/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

import { ConfirmationAlertDialog } from "@/components/shared";
import { deleteDocument } from "@/lib/documents/document-mutations";
import { removeDocumentCache } from "@/lib/documents/documents-query";
import { toast } from "@repo/ui/components/toaster";

export const DeleteDocumentDialog = ({
  document,
  onOpenChange,
}: {
  document: Document | null;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteDocument,
    onError: (error) =>
      toast.error("Unable to delete document", { description: error.message }),
    onSuccess: async (_, documentId) => {
      onOpenChange(false);
      removeDocumentCache(queryClient, documentId);
      toast.success("Document deleted");
    },
  });

  return (
    <ConfirmationAlertDialog
      confirmIcon={<Trash2 />}
      confirmLabel="Delete document"
      confirmVariant="destructive"
      description={`This will permanently delete ${document?.fileName ?? "this document"}. This action cannot be undone.`}
      disabled={!document}
      onConfirm={() => {
        if (document) mutation.mutate(document.id);
      }}
      onOpenChange={(open) => {
        if (!mutation.isPending) onOpenChange(open);
      }}
      open={document !== null}
      pending={mutation.isPending}
      pendingLabel="Deleting..."
      title="Delete document?"
    />
  );
};
