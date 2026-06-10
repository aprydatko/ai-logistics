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

const toLocalDateTime = (date: Date, time: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${time || "00:00"}`;
};

type DateTimePickerFieldProps = {
  onChange: (value: string) => void;
  value: string;
};

export const DateTimePickerField = ({
  onChange,
  value,
}: DateTimePickerFieldProps): React.JSX.Element => {
  const selectedDate = value ? new Date(value) : undefined;
  const selectedTime = value.includes("T") ? value.slice(11, 16) : "";
  const label = selectedDate
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(selectedDate)
    : "Select incident date and time";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-12 w-full justify-start bg-white px-3 font-normal shadow-none hover:bg-white",
            !selectedDate && "text-muted-foreground",
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
          defaultMonth={selectedDate}
          mode="single"
          onSelect={(date) => {
            if (date) onChange(toLocalDateTime(date, selectedTime));
          }}
          selected={selectedDate}
        />
        <div className="flex items-center gap-2 border-t border-border p-3">
          <Clock className="size-4 text-primary-700" />
          <Input
            aria-label="Incident time"
            className="h-9"
            onChange={(event) =>
              onChange(
                toLocalDateTime(selectedDate ?? new Date(), event.target.value),
              )
            }
            type="time"
            value={selectedTime}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
