import { Plus, RotateCcw } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { SearchField } from "@repo/ui/components/search-field";
import { SelectButton } from "@repo/ui/components/select-button";

import type { IncidentFilters } from "./types";

const priorityOptions = [
  { label: "All priorities", value: "all" },
  { label: "High", value: "High" },
  { label: "Medium", value: "Medium" },
  { label: "Low", value: "Low" },
];

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Open", value: "Open" },
  { label: "Investigating", value: "Investigating" },
  { label: "Monitoring", value: "Monitoring" },
  { label: "Resolved", value: "Resolved" },
  { label: "Closed", value: "Closed" },
];

const dateOptions = [
  { label: "All dates", value: "all" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Older", value: "older" },
];

type IncidentsToolbarProps = {
  filters: IncidentFilters;
  onChange: (filters: Partial<IncidentFilters>) => void;
  onReset: () => void;
  onReport: () => void;
};

export const IncidentsToolbar = ({
  filters,
  onChange,
  onReset,
  onReport,
}: IncidentsToolbarProps): React.JSX.Element => {
  const hasFilters = Object.values(filters).some(
    (value) => value !== "all" && value !== "",
  );

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-2xl leading-9 text-ink-900">Incidents</h1>
        <p className="max-w-2xl text-sm text-primary-700">
          List cards, incident summary, AI timeline, and status updates.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchField
          className="min-w-56 flex-1"
          label="Search incidents"
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Search incidents"
          value={filters.search}
        />
        <SelectButton
          className="sm:min-w-36"
          onValueChange={(priority) =>
            onChange({ priority: priority as IncidentFilters["priority"] })
          }
          options={priorityOptions}
          placeholder="Priority"
          value={filters.priority}
        />
        <SelectButton
          className="sm:min-w-36"
          onValueChange={(status) =>
            onChange({ status: status as IncidentFilters["status"] })
          }
          options={statusOptions}
          placeholder="Status"
          value={filters.status}
        />
        <SelectButton
          className="sm:min-w-32"
          onValueChange={(date) =>
            onChange({ date: date as IncidentFilters["date"] })
          }
          options={dateOptions}
          placeholder="Date"
          value={filters.date}
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
          onClick={onReport}
          type="button"
        >
          <Plus className="size-4" />
          Report incident
        </Button>
      </div>
    </div>
  );
};
