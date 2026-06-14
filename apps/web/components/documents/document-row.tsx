"use client";

import { Download, Ellipsis, Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { ActionMenu } from "@repo/ui/components/action-menu";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { TableCell, TableRow } from "@repo/ui/components/table";
import { cn } from "@repo/ui/lib/utils";

import type { DocumentRowData, DocumentStatus } from "./types";

const statusLabels: Record<DocumentStatus, string> = {
  complete: "Complete",
  needs_review: "Needs review",
  processing: "Processing",
};

const statusTones: Record<
  DocumentStatus,
  "success" | "warning" | "info"
> = {
  complete: "success",
  needs_review: "warning",
  processing: "info",
};

interface DocumentRowProps {
  document: DocumentRowData;
  isSelected: boolean;
  onSelectChange: (documentId: string, checked: boolean) => void;
}

export const DocumentRow = ({
  document,
  isSelected,
  onSelectChange,
}: DocumentRowProps): React.JSX.Element => {
  const router = useRouter();

  return (
    <TableRow isSelected={isSelected}>
      <TableCell className="w-10 text-center">
        <Checkbox
          aria-label={`${isSelected ? "Deselect" : "Select"} ${document.fileName}`}
          checked={isSelected}
          onCheckedChange={(checked) => {
            onSelectChange(document.id, checked === true);
          }}
        />
      </TableCell>
      <TableCell className="max-w-0">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-ink-900">
            {document.fileName}
          </p>
          <p className="mt-1 truncate text-[0.65rem] leading-none text-primary-700">
            {document.fileSize} · {document.uploadedAt}
          </p>
        </div>
      </TableCell>
      <TableCell className="max-w-0">
        <span className="block truncate text-xs font-medium text-ink-900">
          {document.type}
        </span>
      </TableCell>
      <TableCell className="max-w-0">
        <span className="block truncate text-xs font-medium text-ink-900">
          {document.driver}
        </span>
      </TableCell>
      <TableCell className="max-w-0">
        <span className="block truncate text-xs font-semibold text-info">
          {document.load}
        </span>
      </TableCell>
      <TableCell className="max-w-0">
        <StatusBadge size="sm" tone={statusTones[document.status]}>
          {statusLabels[document.status]}
        </StatusBadge>
      </TableCell>
      <TableCell className="max-w-0">
        <span className="block truncate text-xs font-medium text-ink-900">
          {document.uploadedAt}
        </span>
      </TableCell>
      <TableCell className="w-14 text-right">
        <ActionMenu
          ariaLabel={`Actions for ${document.fileName}`}
          items={[
            {
              icon: Eye,
              label: "View document",
              onSelect: () => {
                router.push(`/documents/${document.id}`);
              },
            },
            {
              icon: Download,
              label: "Download",
              onSelect: () => undefined,
            },
            {
              icon: Trash2,
              label: "Delete",
              onSelect: () => undefined,
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
