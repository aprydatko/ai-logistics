import { Plus, RotateCcw } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { SearchField } from "@repo/ui/components/search-field";
import { SelectButton } from "@repo/ui/components/select-button";
import type {
  DriversApiItem,
  DriversFilters,
} from "@/lib/drivers/drivers-query";

const driverStatusOptions: Array<{
  label: string;
  value: DriversApiItem["status"] | "all";
}> = [
  { label: "All statuses", value: "all" },
  { label: "Available", value: "available" },
  { label: "On trip", value: "on_trip" },
  { label: "Off duty", value: "off_duty" },
  { label: "Maintenance", value: "maintenance" },
];

const driverActivityOptions = [
  { label: "All drivers", value: "all" },
  { label: "Active only", value: "true" },
  { label: "Inactive only", value: "false" },
];

interface DriversToolbarProps {
  filters: DriversFilters;
  onActivityChange: (value: DriversFilters["isActive"]) => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: DriversFilters["status"]) => void;
}

export const DriversToolbar = ({
  filters,
  onActivityChange,
  onReset,
  onSearchChange,
  onStatusChange,
}: DriversToolbarProps): React.JSX.Element => {
  const hasFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.isActive !== "all";

  return (
    <div className="flex flex-col gap-7 xl:justify-between">
      <div>
        <h1 className="text-2xl leading-9 text-ink-900">Drivers</h1>
        <p className="max-w-2xl text-sm text-primary-700">
          Search the fleet, check availability, and open driver profiles.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchField
          className="min-w-56 flex-1"
          label="Search drivers"
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
          placeholder="Name, phone, truck, or trailer"
          value={filters.search}
        />
        <SelectButton
          className="sm:min-w-40"
          onValueChange={(value) => {
            onStatusChange(value as DriversFilters["status"]);
          }}
          options={driverStatusOptions}
          placeholder="Status"
          value={filters.status}
        />
        <SelectButton
          className="sm:min-w-40"
          onValueChange={(value) => {
            onActivityChange(value as DriversFilters["isActive"]);
          }}
          options={driverActivityOptions}
          placeholder="Activity"
          value={filters.isActive}
        />
        {hasFilters ? (
          <Button
            className="h-9 px-3 text-primary-700"
            onClick={onReset}
            type="button"
            variant="ghost"
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        ) : null}
        <Button
          className="h-9 rounded-lg bg-primary-700 px-3! shadow-none hover:bg-primary-600"
          type="button"
        >
          <Plus className="size-4" />
          Create driver
        </Button>
      </div>
    </div>
  );
};
