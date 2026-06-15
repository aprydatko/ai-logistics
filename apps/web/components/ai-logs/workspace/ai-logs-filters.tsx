import { CalendarDays, SlidersHorizontal } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { SelectButton } from "@repo/ui/components/select-button";

import { modelOptions, statusOptions } from "./constants";
import type { AiLogFilterOption } from "./types";

type Props = {
  model: string;
  operation: string;
  operationOptions: AiLogFilterOption[];
  status: string;
  updateModel: (value: string) => void;
  updateOperation: (value: string) => void;
  updateStatus: (value: string) => void;
};

export const AiLogsFilters = ({
  model,
  operation,
  operationOptions,
  status,
  updateModel,
  updateOperation,
  updateStatus,
}: Props): React.JSX.Element => (
  <div className="flex shrink-0 flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
    <label className="min-w-44 flex-1 text-xs font-semibold text-ink-500">
      Model
      <SelectButton
        className="mt-1 w-full"
        options={modelOptions}
        placeholder="Model"
        value={model}
        onValueChange={updateModel}
      />
    </label>
    <label className="min-w-44 flex-1 text-xs font-semibold text-ink-500">
      Status
      <SelectButton
        className="mt-1 w-full"
        options={statusOptions}
        placeholder="Status"
        value={status}
        onValueChange={updateStatus}
      />
    </label>
    <label className="min-w-48 flex-1 text-xs font-semibold text-ink-500">
      Operation
      <SelectButton
        className="mt-1 w-full"
        options={operationOptions}
        placeholder="Operation"
        value={operation}
        onValueChange={updateOperation}
      />
    </label>
    <Button
      className="h-11 min-w-40 justify-between bg-card text-primary-700"
      variant="outline"
    >
      <CalendarDays />
      May 24 – May 28
    </Button>
    <Button
      className="h-11 min-w-36 bg-card text-primary-700"
      variant="outline"
    >
      <SlidersHorizontal />
      More filters
    </Button>
  </div>
);
