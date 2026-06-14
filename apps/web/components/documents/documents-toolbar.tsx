"use client";

import type { DocumentStatus, DocumentType } from "@repo/shared";
import { RotateCcw } from "lucide-react";

import type { DriverCandidate } from "@/lib/drivers/driver-candidates-query";
import { Button } from "@repo/ui/components/button";
import { SearchField } from "@repo/ui/components/search-field";
import { SelectButton } from "@repo/ui/components/select-button";

import { documentTypeLabels, type DocumentFilters } from "./types";

const statusOptions: Array<{
  label: string;
  value: DocumentStatus | "all";
}> = [
  { label: "All statuses", value: "all" },
  { label: "Complete", value: "complete" },
  { label: "Processing", value: "processing" },
  { label: "Needs review", value: "needs_review" },
];

export const DocumentsToolbar = ({
  driverOptions,
  filters,
  onChange,
  onReset,
}: {
  driverOptions: DriverCandidate[];
  filters: DocumentFilters;
  onChange: (updates: Partial<DocumentFilters>) => void;
  onReset: () => void;
}): React.JSX.Element => {
  const hasFilters =
    filters.search !== "" ||
    filters.driverId !== "all" ||
    filters.type !== "all" ||
    filters.status !== "all";

  return (
    <div className="flex flex-col gap-7 xl:justify-between">
      <div>
        <h1 className="text-2xl leading-9 text-ink-900">Documents</h1>
        <p className="max-w-2xl text-sm text-primary-700">
          Find logistics documents, review extraction status, and open files.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchField
          className="min-w-56 flex-1"
          label="Search documents"
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="File name, driver, load, or type"
          value={filters.search}
        />
        <SelectButton
          className="sm:min-w-44"
          onValueChange={(driverId) => onChange({ driverId })}
          options={[
            { label: "All drivers", value: "all" },
            ...driverOptions.map((driver) => ({
              label: `${driver.firstName} ${driver.lastName}`,
              value: driver.id,
            })),
          ]}
          placeholder="Driver"
          value={filters.driverId}
        />
        <SelectButton
          className="sm:min-w-48"
          onValueChange={(type) =>
            onChange({ type: type as DocumentFilters["type"] })
          }
          options={[
            { label: "All document types", value: "all" },
            ...(Object.entries(documentTypeLabels) as Array<
              [DocumentType, string]
            >).map(([value, label]) => ({ label, value })),
          ]}
          placeholder="Document type"
          value={filters.type}
        />
        <SelectButton
          className="sm:min-w-40"
          onValueChange={(status) =>
            onChange({ status: status as DocumentFilters["status"] })
          }
          options={statusOptions}
          placeholder="Status"
          value={filters.status}
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
      </div>
    </div>
  );
};
