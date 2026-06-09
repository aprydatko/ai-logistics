"use client";

import { CalendarDays, Clock } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { Calendar } from "@repo/ui/components/calendar";
import { Input } from "@repo/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { cn } from "@repo/ui/lib/utils";

const toLocalValue = (date: Date, time: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${time || "00:00"}`;
};

export const DateTimePickerField = ({
  onChange,
  placeholder = "Select date and time",
  value,
}: {
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}): React.JSX.Element => {
  const selected = value ? new Date(value) : undefined;
  const time = value.includes("T") ? value.slice(11, 16) : "";
  const label = selected
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(selected)
    : placeholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-10 w-full justify-start bg-white px-3 font-normal",
            !selected && "text-muted-foreground",
          )}
          type="button"
          variant="outline"
        >
          <CalendarDays className="size-4 text-primary-700" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          defaultMonth={selected}
          mode="single"
          onSelect={(date) => {
            if (date) onChange(toLocalValue(date, time));
          }}
          selected={selected}
        />
        <div className="flex items-center gap-2 border-t border-border p-3">
          <Clock className="size-4 text-primary-700" />
          <Input
            className="h-9"
            onChange={(event) =>
              onChange(
                toLocalValue(selected ?? new Date(), event.target.value),
              )
            }
            type="time"
            value={time}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
