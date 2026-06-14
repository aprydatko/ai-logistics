"use client";

import type { Document, DocumentStatus } from "@repo/shared";
import { Ellipsis, Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { ActionMenu } from "@repo/ui/components/action-menu";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { TableCell, TableRow } from "@repo/ui/components/table";
import { cn } from "@repo/ui/lib/utils";

import { formatDocumentFileSize, formatDocumentType } from "./types";

const statusLabels: Record<DocumentStatus, string> = {
  complete: "Complete",
  needs_review: "Needs review",
  processing: "Processing",
};

const statusTones: Record<DocumentStatus, "success" | "warning" | "info"> = {
  complete: "success",
  needs_review: "warning",
  processing: "info",
};

export const DocumentRow = ({
  document,
  isSelected,
  onDelete,
  onEdit,
  onSelectChange,
}: {
  document: Document;
  isSelected: boolean;
  onDelete: (document: Document) => void;
  onEdit: (document: Document) => void;
  onSelectChange: (documentId: string, checked: boolean) => void;
}): React.JSX.Element => {
  const router = useRouter();

  return (
    <TableRow isSelected={isSelected}>
      <TableCell className="w-10 text-center">
        <Checkbox
          aria-label={`${isSelected ? "Deselect" : "Select"} ${document.fileName}`}
          checked={isSelected}
          onCheckedChange={(checked) =>
            onSelectChange(document.id, checked === true)
          }
        />
      </TableCell>
      <TableCell className="max-w-0">
        <p className="truncate text-xs font-semibold text-ink-900">
          {document.fileName}
        </p>
        <p className="mt-1 text-[0.65rem] leading-none text-primary-700">
          {formatDocumentFileSize(document.fileSize)}
        </p>
      </TableCell>
      <TableCell className="max-w-0 truncate text-xs font-medium">
        {formatDocumentType(document.type)}
      </TableCell>
      <TableCell className="max-w-0 truncate text-xs font-medium">
        {document.driver
          ? `${document.driver.firstName} ${document.driver.lastName}`
          : "Unassigned"}
      </TableCell>
      <TableCell className="max-w-0 truncate text-xs font-semibold text-info">
        {document.load?.referenceNumber ?? "Unassigned"}
      </TableCell>
      <TableCell>
        <StatusBadge size="sm" tone={statusTones[document.status]}>
          {statusLabels[document.status]}
        </StatusBadge>
      </TableCell>
      <TableCell className="max-w-0 truncate text-xs font-medium">
        {new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(document.uploadedAt))}
      </TableCell>
      <TableCell className="w-14 text-right">
        <ActionMenu
          ariaLabel={`Actions for ${document.fileName}`}
          items={[
            {
              icon: Eye,
              label: "View document",
              onSelect: () => router.push(`/documents/${document.id}`),
            },
            { icon: Pencil, label: "Edit", onSelect: () => onEdit(document) },
            {
              icon: Trash2,
              label: "Delete",
              onSelect: () => onDelete(document),
              tone: "danger",
            },
          ]}
          trigger={(isOpen) => (
            <Button
              aria-label={`Open actions for ${document.fileName}`}
              className={cn(
                "text-primary-700",
                isOpen && "bg-accent text-accent-foreground",
              )}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Ellipsis className="size-5" />
            </Button>
          )}
        />
      </TableCell>
    </TableRow>
  );
};
