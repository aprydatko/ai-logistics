"use client";

import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

import { Calendar } from "./calendar";

type BasicCalendarProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "numberOfMonths"
> & {
  selected?: Date;
};

export function BasicCalendar({
  className,
  selected,
  ...props
}: BasicCalendarProps): React.JSX.Element {
  return (
    <Calendar
      className={cn("rounded-lg border", className)}
      mode="single"
      selected={selected}
      {...props}
    />
  );
}
