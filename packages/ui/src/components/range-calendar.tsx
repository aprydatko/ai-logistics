"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";

import { cn } from "@repo/ui/lib/utils";

import { Calendar } from "./calendar";

type RangeCalendarProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "numberOfMonths"
> & {
  numberOfMonths?: number;
  onSelect?: (range: DateRange | undefined) => void;
  selected?: DateRange;
};

export function RangeCalendar({
  className,
  numberOfMonths = 2,
  selected,
  ...props
}: RangeCalendarProps): React.JSX.Element {
  return (
    <Calendar
      className={cn("rounded-lg border", className)}
      mode="range"
      numberOfMonths={numberOfMonths}
      selected={selected}
      {...props}
    />
  );
}
