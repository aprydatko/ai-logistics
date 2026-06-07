import { Ellipsis, Eye, Pencil, Trash2 } from "lucide-react";

import { ActionMenu } from "@repo/ui/components/action-menu";
import { DriverAvatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { TableCell, TableRow } from "@repo/ui/components/table";
import { cn } from "@repo/ui/lib/utils";

import { driverStatusTone, truckStateStyles } from "../mock";
import type { DriverRow as DriverRowData } from "../types";

interface DriverRowProps {
  driver: DriverRowData;
  isSelected: boolean;
  onOpenProfile: (driver: DriverRowData) => void;
  onSelectChange: (driverId: string, checked: boolean) => void;
  onEdit: (driver: DriverRowData) => void;
  onDelete: (driver: DriverRowData) => void;
}

export const DriverRow = ({
  driver,
  isSelected,
  onOpenProfile,
  onSelectChange,
  onEdit,
  onDelete,
}: DriverRowProps): React.JSX.Element => (
  <TableRow isSelected={isSelected}>
    <TableCell className="w-8 text-center">
      <span className="inline-flex align-middle">
        <Checkbox
          aria-label={`${isSelected ? "Deselect" : "Select"} ${driver.name}`}
          checked={isSelected}
          onCheckedChange={(checked) => {
            onSelectChange(driver.id, checked === true);
          }}
        />
      </span>
    </TableCell>
    <TableCell className="max-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <DriverAvatar
          imageUrl={driver.avatarUrl}
          name={driver.name}
          size="default"
        />
        <div className="min-w-0">
          <button
            className="block max-w-full truncate text-left text-xs leading-none font-semibold text-ink-900 underline-offset-2 transition hover:text-primary-700 hover:underline focus-visible:text-primary-700 focus-visible:underline focus-visible:outline-none"
            onClick={() => {
              onOpenProfile(driver);
            }}
            type="button"
          >
            {driver.name}
          </button>
          <p className="mt-1 truncate text-[0.65rem] leading-none font-normal text-primary-700">
            ID: {driver.id}
          </p>
        </div>
      </div>
    </TableCell>
    <TableCell className="max-w-0">
      <StatusBadge size="sm" tone={driverStatusTone[driver.status]}>
        {driver.status}
      </StatusBadge>
    </TableCell>
    <TableCell className="max-w-0">
      <span className="flex min-w-0 items-center gap-2.5 text-xs font-medium text-ink-900">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            truckStateStyles[driver.truckState],
          )}
        />
        <span className="truncate">{driver.truck}</span>
      </span>
    </TableCell>
    <TableCell className="max-w-0">
      <span className="block truncate text-xs font-medium text-ink-900">
        {driver.currentLoad ?? "-"}
      </span>
    </TableCell>
    <TableCell className="max-w-0">
      {driver.eta.time ? (
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-ink-900">
            {driver.eta.time}
          </p>
          {driver.eta.state ? (
            <p
              className={cn(
                "mt-0.5 truncate text-xs font-semibold",
                driver.eta.state === "Delayed"
                  ? "text-warning"
                  : "text-teal-600",
              )}
            >
              {driver.eta.state}
            </p>
          ) : null}
        </div>
      ) : (
        <span className="text-sm font-medium text-primary-700">-</span>
      )}
    </TableCell>
    <TableCell className="w-16 text-right">
      <ActionMenu
        ariaLabel={`Actions for ${driver.name}`}
        items={[
          {
            icon: Eye,
            label: "View driver profile",
            onSelect: () => {
              onOpenProfile(driver);
            },
          },
          {
            icon: Pencil,
            label: "Edit driver",
            onSelect: () => {
              onEdit(driver);
            },
          },
          {
            icon: Trash2,
            label: "Delete driver",
            onSelect: () => {
              onDelete(driver);
            },
            tone: "danger",
          },
        ]}
        trigger={(isOpen) => (
          <Button
            aria-label={`Open actions for ${driver.name}`}
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
