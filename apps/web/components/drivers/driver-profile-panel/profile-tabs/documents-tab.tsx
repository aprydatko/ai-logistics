import {
  ClipboardCheck,
  FileBadge,
  FileText,
  type LucideIcon,
} from "lucide-react";

import type { DriverDetails } from "@/lib/drivers/drivers-query";
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

          return (
            <div className="flex items-center gap-3 py-3" key={document.id}>
              <Icon className="size-5 text-primary-700" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{document.name}</p>
                {document.expiresAt ? (
                  <p className="text-xs text-primary-700">
                    Expires {formatDate(document.expiresAt)}
                  </p>
                ) : null}
              </div>
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            </div>
          );
        })}
      </div>
    </PanelSection>
  );
};
