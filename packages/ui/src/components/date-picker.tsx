"use client";

import { CalendarDays } from "lucide-react";
import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type DatePickerProps = {
  className?: string;
  fromDate?: Date;
  onChange: (value: string) => void;
  placeholder?: string;
  toDate?: Date;
  value?: string;
};

const toDate = (value?: string): Date | undefined =>
  value ? new Date(`${value}T00:00:00`) : undefined;

const toDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const DatePicker = ({
  className,
  fromDate,
  onChange,
  placeholder = "Select date",
  toDate: maximumDate,
  value,
}: DatePickerProps): React.JSX.Element => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selected = toDate(value);
  const label = selected
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(selected)
    : placeholder;

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-10 w-full justify-start border-input bg-white px-3 text-left font-normal shadow-xs hover:bg-white",
            !selected && "text-muted-foreground",
            className,
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
          captionLayout="dropdown"
          defaultMonth={selected ?? fromDate ?? maximumDate}
          disabled={[
            ...(fromDate ? [{ before: fromDate }] : []),
            ...(maximumDate ? [{ after: maximumDate }] : []),
          ]}
          endMonth={new Date(2040, 11)}
          mode="single"
          onSelect={(date) => {
            if (!date) return;
            onChange(toDateValue(date));
            setIsOpen(false);
          }}
          selected={selected}
          startMonth={new Date(1940, 0)}
        />
      </PopoverContent>
    </Popover>
  );
};
