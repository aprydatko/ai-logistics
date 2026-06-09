"use client";

import { CalendarDays, X } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { RangeCalendar } from "@repo/ui/components/range-calendar";
import { cn } from "@repo/ui/lib/utils";

const parseDate = (value: string): Date | undefined =>
  value ? new Date(`${value}T00:00:00`) : undefined;

const formatValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const PickupRangeFilter = ({
  from,
  onChange,
  to,
}: {
  from: string;
  onChange: (range: { from: string; to: string }) => void;
  to: string;
}): React.JSX.Element => {
  const selected: { from: Date | undefined; to?: Date } | undefined =
    from || to ? { from: parseDate(from), to: parseDate(to) } : undefined;
  const label = selected?.from
    ? selected.to
      ? `${selected.from.toLocaleDateString()} – ${selected.to.toLocaleDateString()}`
      : selected.from.toLocaleDateString()
    : "Pickup period";

  return (
    <div className="flex items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "h-9 min-w-44 justify-start bg-white font-normal",
              !selected?.from && "text-muted-foreground",
            )}
            type="button"
            variant="outline"
          >
            <CalendarDays className="size-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <RangeCalendar
            defaultMonth={selected?.from}
            onSelect={(range) =>
              onChange({
                from: range?.from ? formatValue(range.from) : "",
                to: range?.to ? formatValue(range.to) : "",
              })
            }
            selected={selected}
          />
        </PopoverContent>
      </Popover>
      {selected?.from ? (
        <Button
          aria-label="Clear pickup period"
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
