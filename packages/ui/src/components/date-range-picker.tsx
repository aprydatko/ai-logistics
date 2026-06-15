"use client";

import { format } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { cn } from "@repo/ui/lib/utils";

import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { RangeCalendar } from "./range-calendar";

type DateRangeValue = {
  from: string;
  to: string;
};

type DateRangePickerProps = {
  buttonClassName?: string;
  className?: string;
  label?: string;
  onChange: (value: DateRangeValue) => void;
  value: DateRangeValue;
};

const parseDate = (value: string): Date | undefined =>
  value ? new Date(`${value}T00:00:00`) : undefined;

const toDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const DateRangePicker = ({
  buttonClassName,
  className,
  label = "Select period",
  onChange,
  value,
}: DateRangePickerProps): React.JSX.Element => {
  const selected: DateRange | undefined =
    value.from || value.to
      ? {
          from: parseDate(value.from),
          to: parseDate(value.to),
        }
      : undefined;

  const valueLabel = selected?.from
    ? selected.to
      ? `${format(selected.from, "MMM d, yyyy")} - ${format(selected.to, "MMM d, yyyy")}`
      : format(selected.from, "MMM d, yyyy")
    : label;

  return (
    <div className={cn("flex items-center", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "h-11 min-w-48 justify-start gap-2 rounded-lg border-border bg-card px-4 text-left font-normal text-primary-700 shadow-none hover:bg-surface-50",
              !selected?.from && "text-primary-700/75",
              buttonClassName,
            )}
            type="button"
            variant="outline"
          >
            <CalendarDays className="size-4" />
            <span className="truncate">{valueLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <RangeCalendar
            className="border-0"
            defaultMonth={selected?.from}
            onSelect={(range) =>
              onChange({
                from: range?.from ? toDateValue(range.from) : "",
                to: range?.to ? toDateValue(range.to) : "",
              })
            }
            selected={selected}
          />
        </PopoverContent>
      </Popover>
      {selected?.from ? (
        <Button
          aria-label="Clear selected period"
          className="-ml-1 size-9"
          onClick={() => onChange({ from: "", to: "" })}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
};
