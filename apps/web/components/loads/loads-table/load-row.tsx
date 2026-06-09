import { ArrowRight, Ellipsis, Eye, Pencil, UserRoundPlus } from "lucide-react";

import { ActionMenu } from "@repo/ui/components/action-menu";
import { DriverAvatar } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { TableCell, TableRow } from "@repo/ui/components/table";

import { cn } from "@repo/ui/lib/utils";

import { loadPriorityTone, loadStatusTone } from "../load-styles";
import type { Load } from "../types";

type LoadRowProps = {
  load: Load;
  isSelected: boolean;
  onOpenDetails: (load: Load) => void;
  onSelectChange: (loadId: string, checked: boolean) => void;
};

export const LoadRow = ({
  load,
  isSelected,
  onOpenDetails,
  onSelectChange,
}: LoadRowProps): React.JSX.Element => (
  <TableRow isSelected={isSelected}>
    <TableCell className="w-10 text-center">
      <span className="inline-flex align-middle">
        <Checkbox
          aria-label={`${isSelected ? "Deselect" : "Select"} ${load.id}`}
          checked={isSelected}
          onCheckedChange={(checked) =>
            onSelectChange(load.id, checked === true)
          }
        />
      </span>
    </TableCell>
    <TableCell className="max-w-0">
      <button
        className="block truncate text-left text-xs font-semibold text-ink-900 underline-offset-2 hover:text-primary-700 hover:underline"
        onClick={() => onOpenDetails(load)}
        type="button"
      >
        {load.id}
      </button>
      <p className="mt-1 truncate text-[0.7rem] text-primary-700">
        {load.description}
      </p>
    </TableCell>
    <TableCell className="max-w-0">
      <StatusBadge size="sm" tone={loadStatusTone[load.status]}>
        {load.status}
      </StatusBadge>
    </TableCell>
    <TableCell className="max-w-0">
      {load.driver ? (
        <div className="flex min-w-0 items-center gap-2.5">
          <DriverAvatar imageUrl="" name={load.driver.name} size="default" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink-900">
              {load.driver.name}
            </p>
            <p className="mt-1 truncate text-[0.7rem] text-primary-700">
              {load.driver.truckId}
            </p>
          </div>
        </div>
      ) : (
        <span className="text-sm text-primary-700">-</span>
      )}
    </TableCell>
    <TableCell className="max-w-0">
      <p className="truncate text-xs font-medium text-ink-900">
        {load.route.origin}
      </p>
      <p className="mt-1 flex items-center gap-1 truncate text-[0.7rem] text-primary-700">
        <ArrowRight className="size-3 shrink-0" />
        <span className="truncate">{load.route.destination}</span>
      </p>
    </TableCell>
    <TableCell className="max-w-0">
      {load.eta ? (
        <>
          <p className="truncate text-xs font-medium text-ink-900">
            {load.eta.date}
          </p>
          <p className="mt-1 text-[0.7rem] text-primary-700">{load.eta.time}</p>
        </>
      ) : (
        <span className="text-sm text-primary-700">-</span>
      )}
    </TableCell>
    <TableCell className="max-w-0">
      {load.priority ? (
        <Badge
          className={cn(
            loadPriorityTone[load.priority] === "danger" &&
              "border-transparent bg-danger-background text-danger",
            loadPriorityTone[load.priority] === "warning" &&
              "border-transparent bg-warning-background text-warning",
            loadPriorityTone[load.priority] === "info" &&
              "border-transparent bg-info-background text-info",
          )}
          size="sm"
        >
          {load.priority}
        </Badge>
      ) : (
        <span className="text-sm text-primary-700">-</span>
      )}
    </TableCell>
    <TableCell className="w-14 text-right">
      <ActionMenu
        ariaLabel={`Actions for ${load.id}`}
        items={[
          {
            icon: Eye,
            label: "View load",
            onSelect: () => onOpenDetails(load),
          },
          { icon: Pencil, label: "Edit load", onSelect: () => undefined },
          {
            icon: UserRoundPlus,
            label: "Assign driver",
            onSelect: () => undefined,
          },
        ]}
        trigger={(isOpen) => (
          <Button
            aria-label={`Open actions for ${load.id}`}
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
