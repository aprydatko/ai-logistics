import { Plus, RotateCcw } from "lucide-react";

import type { LoadsFilters } from "@/lib/loads/loads-query";
import { Button } from "@repo/ui/components/button";
import { SearchField } from "@repo/ui/components/search-field";
import { SelectButton } from "@repo/ui/components/select-button";

import { PickupRangeFilter } from "./pickup-range-filter";

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Assigned", value: "assigned" },
  { label: "In transit", value: "in_transit" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export const LoadsToolbar = ({
  filters,
  onCreateLoad,
  onFiltersChange,
  onReset,
}: {
  filters: LoadsFilters;
  onCreateLoad: () => void;
  onFiltersChange: (filters: Partial<LoadsFilters>) => void;
  onReset: () => void;
}): React.JSX.Element => {
  const hasFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.pickupFrom !== "" ||
    filters.pickupTo !== "";

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-2xl leading-9 text-ink-900">Loads</h1>
        <p className="max-w-2xl text-sm text-primary-700">
          Track assignments, pickup windows, ETA, and delivery status.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          className="min-w-56 flex-1"
          label="Search loads"
          onChange={(event) => onFiltersChange({ search: event.target.value })}
          placeholder="Reference, pickup, or destination"
          value={filters.search}
        />
        <SelectButton
          className="min-w-36"
          onValueChange={(status) =>
            onFiltersChange({ status: status as LoadsFilters["status"] })
          }
          options={statusOptions}
          placeholder="Status"
          value={filters.status}
        />
        <PickupRangeFilter
          from={filters.pickupFrom}
          onChange={(range) =>
            onFiltersChange({
              pickupFrom: range.from,
              pickupTo: range.to,
            })
          }
          to={filters.pickupTo}
        />
        {hasFilters ? (
          <Button onClick={onReset} type="button" variant="ghost">
            <RotateCcw className="size-4" /> Reset
          </Button>
        ) : null}
        <Button onClick={onCreateLoad} type="button">
          <Plus className="size-4" /> Create load
        </Button>
      </div>
    </div>
  );
};
