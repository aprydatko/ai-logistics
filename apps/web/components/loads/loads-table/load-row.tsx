import { ArrowRight, Ellipsis, Eye, Pencil, UserRoundPlus } from "lucide-react";

import type { LoadApiItem } from "@/lib/loads/loads-query";
import { ActionMenu } from "@repo/ui/components/action-menu";
import { DriverAvatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { TableCell, TableRow } from "@repo/ui/components/table";

import { loadStatusTone } from "../load-styles";

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const LoadRow = ({
  load,
  isSelected,
  onAssign,
  onEdit,
  onOpenDetails,
  onSelectChange,
}: {
  load: LoadApiItem;
  isSelected: boolean;
  onAssign: (load: LoadApiItem) => void;
  onEdit: (load: LoadApiItem) => void;
  onOpenDetails: (load: LoadApiItem) => void;
  onSelectChange: (loadId: string, checked: boolean) => void;
}): React.JSX.Element => (
  <TableRow isSelected={isSelected}>
    <TableCell className="text-center">
      <Checkbox
        aria-label={`Select ${load.referenceNumber}`}
        checked={isSelected}
        onCheckedChange={(checked) => onSelectChange(load.id, checked === true)}
      />
    </TableCell>
    <TableCell className="max-w-0">
      <button
        className="truncate text-left text-xs font-semibold text-ink-900 hover:underline"
        onClick={() => onOpenDetails(load)}
        type="button"
      >
        {load.referenceNumber}
      </button>
      <p className="mt-1 truncate text-[0.7rem] text-primary-700">
        {load.broker.companyName}
      </p>
    </TableCell>
    <TableCell>
      <StatusBadge size="sm" tone={loadStatusTone[load.status]}>
        {load.status.replace("_", " ")}
      </StatusBadge>
    </TableCell>
    <TableCell className="max-w-0">
      {load.driver ? (
        <div className="flex items-center gap-2">
          <DriverAvatar
            imageUrl={load.driver.avatarUrl ?? ""}
            name={`${load.driver.firstName} ${load.driver.lastName}`}
            size="default"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">
              {load.driver.firstName} {load.driver.lastName}
            </p>
            <p className="text-[0.7rem] text-primary-700">
              {load.driver.truckNumber ?? "No truck"}
            </p>
          </div>
        </div>
      ) : (
        <span className="text-xs text-primary-700">Unassigned</span>
      )}
    </TableCell>
    <TableCell className="max-w-0">
      <p className="truncate text-xs font-medium">{load.pickupAddress}</p>
      <p className="mt-1 flex items-center gap-1 truncate text-[0.7rem] text-primary-700">
        <ArrowRight className="size-3 shrink-0" />
        <span className="truncate">{load.deliveryAddress}</span>
      </p>
    </TableCell>
    <TableCell className="text-xs">
      {formatDateTime(load.deliveryDate)}
    </TableCell>
    <TableCell className="text-xs">
      <p>{load.miles.toLocaleString()} mi</p>
      <p className="mt-1 text-[0.7rem] text-primary-700">
        ${load.price.toLocaleString()}
      </p>
    </TableCell>
    <TableCell className="text-right">
      <ActionMenu
        ariaLabel={`Actions for ${load.referenceNumber}`}
        items={[
          {
            icon: Eye,
            label: "View load",
            onSelect: () => onOpenDetails(load),
          },
          { icon: Pencil, label: "Edit load", onSelect: () => onEdit(load) },
          {
            icon: UserRoundPlus,
            label: "Assign driver",
            onSelect: () => onAssign(load),
          },
        ]}
        trigger={() => (
          <Button size="icon-sm" type="button" variant="ghost">
            <Ellipsis className="size-5" />
          </Button>
        )}
      />
    </TableCell>
  </TableRow>
);
