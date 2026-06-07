"use client";

import { CalendarDays } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { cn } from "@repo/ui/lib/utils";

interface DatePickerFieldProps {
  onChange: (value: string) => void;
  placeholder?: string;
  value?: string;
}

export const DatePickerField = ({
  onChange,
  placeholder = "Select date",
  value,
}: DatePickerFieldProps): React.JSX.Element => {
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const displayValue = selected
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(selected)
    : placeholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-10 w-full justify-start border-input bg-white px-3 text-left font-normal shadow-xs hover:bg-white",
            !selected && "text-muted-foreground",
          )}
          type="button"
          variant="outline"
        >
          <CalendarDays className="size-4 text-primary-700" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          captionLayout="dropdown"
          defaultMonth={selected}
          endMonth={new Date(2040, 11)}
          mode="single"
          onSelect={(date) => {
            if (!date) return;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            onChange(`${year}-${month}-${day}`);
          }}
          selected={selected}
          startMonth={new Date(1940, 0)}
        />
      </PopoverContent>
    </Popover>
  );
};
