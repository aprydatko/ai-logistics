import { Ellipsis, Eye, Pencil } from "lucide-react";

import { ActionMenu } from "@repo/ui/components/action-menu";
import { DriverAvatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { TableCell, TableRow } from "@repo/ui/components/table";

import {
  incidentPriorityLabels,
  incidentStatusLabels,
  type Incident,
  type IncidentPriority,
  type IncidentStatus,
} from "../types";

const priorityTone: Record<IncidentPriority, "danger" | "warning" | "info"> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "info",
};

const statusTone: Record<
  IncidentStatus,
  "danger" | "warning" | "info" | "success" | "neutral"
> = {
  open: "danger",
  investigating: "info",
  monitoring: "info",
  resolved: "success",
  closed: "neutral",
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
        {incident.location ?? "-"}
      </p>
    </TableCell>
    <TableCell>
      <StatusBadge size="sm" tone={priorityTone[incident.priority]}>
        {incidentPriorityLabels[incident.priority]}
      </StatusBadge>
    </TableCell>
    <TableCell>
      <StatusBadge size="sm" tone={statusTone[incident.status]}>
        {incidentStatusLabels[incident.status]}
      </StatusBadge>
    </TableCell>
    <TableCell className="max-w-0">
      {incident.load.driver ? (
        <div className="flex min-w-0 items-center gap-2">
          <DriverAvatar
            imageUrl={incident.load.driver.avatarUrl ?? ""}
            name={`${incident.load.driver.firstName} ${incident.load.driver.lastName}`}
            size="default"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink-900">
              {incident.load.driver.firstName} {incident.load.driver.lastName}
            </p>
            <p className="mt-1 truncate text-[0.65rem] text-primary-700">
              {incident.load.driver.truckNumber ?? "No truck"}
            </p>
          </div>
        </div>
      ) : (
        <span className="text-xs text-primary-700">-</span>
      )}
    </TableCell>
    <TableCell className="truncate text-xs font-medium text-primary-700">
      {incident.load.referenceNumber}
    </TableCell>
    <TableCell>
      <p className="text-xs font-medium text-primary-700">
        {new Date(incident.occurredAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <p className="mt-1 text-[0.65rem] text-primary-700">
        {new Date(incident.occurredAt).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })}
      </p>
    </TableCell>
    <TableCell className="truncate text-xs font-medium text-primary-700">
      {new Date(incident.updatedAt).toLocaleDateString()}
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
