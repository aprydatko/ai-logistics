import { Plus, RotateCcw } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { SearchField } from "@repo/ui/components/search-field";
import { SelectButton } from "@repo/ui/components/select-button";

import type { LoadFilters } from "./types";

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "In transit", value: "In Transit" },
  { label: "Delayed", value: "Delayed" },
  { label: "Delivered", value: "Delivered" },
  { label: "Pending", value: "Pending" },
  { label: "Assigned", value: "Assigned" },
  { label: "Cancelled", value: "Cancelled" },
];

const dateOptions = [
  { label: "Any date", value: "all" },
  { label: "May 28", value: "may-28" },
  { label: "May 29 or later", value: "may-29-or-later" },
];

const routeOptions = [
  { label: "All routes", value: "all" },
  { label: "Midwest", value: "midwest" },
  { label: "South", value: "south" },
  { label: "West", value: "west" },
  { label: "Northeast", value: "northeast" },
];

type LoadsToolbarProps = {
  filters: LoadFilters;
  onCreateLoad: () => void;
  onFiltersChange: (filters: Partial<LoadFilters>) => void;
  onReset: () => void;
};

export const LoadsToolbar = ({
  filters,
  onCreateLoad,
  onFiltersChange,
  onReset,
}: LoadsToolbarProps): React.JSX.Element => {
  const hasFilters = Object.values(filters).some(
    (value) => value !== "" && value !== "all",
  );

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-2xl leading-9 text-ink-900">Loads</h1>
        <p className="max-w-2xl text-sm text-primary-700">
          Track statuses, assignments, routes, and delivery timelines.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchField
          className="min-w-56 flex-1"
          label="Search loads"
          onChange={(event) => onFiltersChange({ search: event.target.value })}
          placeholder="Load ID, cargo, driver, or city"
          value={filters.search}
        />
        <SelectButton
          className="sm:min-w-36"
          onValueChange={(status) =>
            onFiltersChange({ status: status as LoadFilters["status"] })
          }
          options={statusOptions}
          placeholder="Status"
          value={filters.status}
        />
        <SelectButton
          className="sm:min-w-32"
          onValueChange={(date) =>
            onFiltersChange({ date: date as LoadFilters["date"] })
          }
          options={dateOptions}
          placeholder="Date"
          value={filters.date}
        />
        <SelectButton
          className="sm:min-w-36"
          onValueChange={(route) =>
            onFiltersChange({ route: route as LoadFilters["route"] })
          }
          options={routeOptions}
          placeholder="Route"
          value={filters.route}
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
          onClick={onCreateLoad}
          type="button"
        >
          <Plus className="size-4" />
          Create load
        </Button>
      </div>
    </div>
  );
};
