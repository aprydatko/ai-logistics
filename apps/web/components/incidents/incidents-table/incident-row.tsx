import { Ellipsis, Eye, Pencil } from "lucide-react";

import { ActionMenu } from "@repo/ui/components/action-menu";
import { DriverAvatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { TableCell, TableRow } from "@repo/ui/components/table";

import type { Incident, IncidentPriority, IncidentStatus } from "../types";

const priorityTone: Record<IncidentPriority, "danger" | "warning" | "info"> = {
  High: "danger",
  Medium: "warning",
  Low: "info",
};

const statusTone: Record<
  IncidentStatus,
  "danger" | "warning" | "info" | "success" | "neutral"
> = {
  Open: "danger",
  Investigating: "info",
  Monitoring: "info",
  Resolved: "success",
  Closed: "neutral",
};

type IncidentRowProps = {
  incident: Incident;
  isSelected: boolean;
  onOpenDetail: (incident: Incident) => void;
  onEdit: (incident: Incident) => void;
  onSelectChange: (id: string, checked: boolean) => void;
};

export const IncidentRow = ({
  incident,
  isSelected,
  onOpenDetail,
  onEdit,
  onSelectChange,
}: IncidentRowProps): React.JSX.Element => (
  <TableRow isSelected={isSelected}>
    <TableCell className="w-8 text-center">
      <Checkbox
        aria-label={`${isSelected ? "Deselect" : "Select"} ${incident.title}`}
        checked={isSelected}
        onCheckedChange={(checked) =>
          onSelectChange(incident.id, checked === true)
        }
      />
    </TableCell>
    <TableCell className="max-w-0">
      <button
        className="block max-w-full truncate text-left text-xs font-semibold text-ink-900 underline-offset-2 transition hover:text-primary-700 hover:underline focus-visible:text-primary-700 focus-visible:underline focus-visible:outline-none"
        onClick={() => onOpenDetail(incident)}
        type="button"
      >
        {incident.title}
      </button>
      <p className="mt-1 truncate text-[0.65rem] text-primary-700">
        {incident.location}
      </p>
    </TableCell>
    <TableCell>
      <StatusBadge size="sm" tone={priorityTone[incident.priority]}>
        {incident.priority}
      </StatusBadge>
    </TableCell>
    <TableCell>
      <StatusBadge size="sm" tone={statusTone[incident.status]}>
        {incident.status}
      </StatusBadge>
    </TableCell>
    <TableCell className="max-w-0">
      {incident.driver ? (
        <div className="flex min-w-0 items-center gap-2">
          <DriverAvatar
            imageUrl={incident.driver.avatarUrl}
            name={incident.driver.name}
            size="default"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink-900">
              {incident.driver.name}
            </p>
            <p className="mt-1 truncate text-[0.65rem] text-primary-700">
              {incident.driver.truck}
            </p>
          </div>
        </div>
      ) : (
        <span className="text-xs text-primary-700">-</span>
      )}
    </TableCell>
    <TableCell className="truncate text-xs font-medium text-primary-700">
      {incident.load ?? "-"}
    </TableCell>
    <TableCell>
      <p className="text-xs font-medium text-primary-700">
        {incident.occurredAt.primary}
      </p>
      <p className="mt-1 text-[0.65rem] text-primary-700">
        {incident.occurredAt.secondary}
      </p>
    </TableCell>
    <TableCell className="truncate text-xs font-medium text-primary-700">
      {incident.updatedAt}
    </TableCell>
    <TableCell className="w-14 text-right">
      <ActionMenu
        ariaLabel={`Actions for ${incident.title}`}
        items={[
          {
            icon: Eye,
            label: "View incident",
            onSelect: () => onOpenDetail(incident),
          },
          {
            icon: Pencil,
            label: "Edit incident",
            onSelect: () => onEdit(incident),
          },
        ]}
        trigger={() => (
          <Button
            aria-label={`Open actions for ${incident.title}`}
            className="text-primary-700"
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
