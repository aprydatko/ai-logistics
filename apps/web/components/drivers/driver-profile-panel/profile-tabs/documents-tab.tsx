import {
  ClipboardCheck,
  FileBadge,
  FileText,
  type LucideIcon,
} from "lucide-react";

import type { DriverDetails } from "@/lib/drivers/drivers-query";
import { Button } from "@repo/ui/components/button";
import { StatusBadge } from "@repo/ui/components/status-badge";

import { EmptyTab, PanelSection } from "../panel-section";
import { formatDate, getDocumentStatus } from "../profile-formatters";

const documentIcon: Record<
  DriverDetails["documents"][number]["type"],
  LucideIcon
> = {
  license: FileBadge,
  medical_card: ClipboardCheck,
  insurance: FileText,
  other: FileText,
};

const formatFileSize = (value: number | null): string | null => {
  if (!value) return null;
  if (value < 1024) return `${value} B`;

  const kilobytes = value / 1024;
  if (kilobytes < 1024) return `${Math.round(kilobytes)} KB`;

  return `${(kilobytes / 1024).toFixed(1)} MB`;
};

export const DocumentsTab = ({
  details,
}: {
  details: DriverDetails;
}): React.JSX.Element => {
  if (!details.documents.length) return <EmptyTab label="Documents" />;

  return (
    <PanelSection title="Documents">
      <div className="divide-y divide-border/70 px-4">
        {details.documents.map((document) => {
          const Icon = documentIcon[document.type];
          const status = getDocumentStatus(document.expiresAt);
          const metadata = [
            document.documentNumber ?? document.type.replaceAll("_", " "),
            document.issuedAt
              ? `Issued ${formatDate(document.issuedAt)}`
              : null,
            document.expiresAt
              ? `Expires ${formatDate(document.expiresAt)}`
              : null,
            formatFileSize(document.fileSize),
          ].filter(Boolean);

          return (
            <div className="flex items-start gap-3 py-3" key={document.id}>
              <Icon className="mt-0.5 size-5 shrink-0 text-primary-700" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{document.name}</p>
                {metadata.length ? (
                  <p className="mt-1 text-xs text-primary-700">
                    {metadata.join(" · ")}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                {document.fileUrl ? (
                  <Button asChild size="sm" type="button" variant="outline">
                    <a href={document.fileUrl} rel="noreferrer" target="_blank">
                      Open
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </PanelSection>
  );
};
