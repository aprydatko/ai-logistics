'use client';

import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@repo/ui/lib/utils';

import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { RangeCalendar } from './range-calendar';

type DateButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'onSelect'
> & {
  defaultRange?: DateRange;
  label?: string;
  onRangeChange?: (range: DateRange | undefined) => void;
};

export function DateButton({
  className,
  defaultRange,
  label = 'Select period',
  onRangeChange,
  type = 'button',
  variant = 'outline',
  ...props
}: DateButtonProps): React.JSX.Element {
  const [range, setRange] = React.useState<DateRange | undefined>(defaultRange);

  const handleSelect = (nextRange: DateRange | undefined): void => {
    setRange(nextRange);
    onRangeChange?.(nextRange);
  };

  const valueLabel =
    range?.from && range.to
      ? `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d')}`
      : range?.from
        ? format(range.from, 'MMM d')
        : label;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'h-9 min-w-44 justify-start gap-2 rounded-lg border-border bg-card px-4 text-left font-normal text-primary-700 shadow-none hover:bg-surface-50',
            !range?.from && 'text-primary-700/75',
            className
          )}
          type={type}
          variant={variant}
          {...props}
        >
          <CalendarDays className="size-4" />
          {valueLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <RangeCalendar
          className="border-0"
          defaultMonth={range?.from}
          onSelect={handleSelect}
          selected={range}
        />
      </PopoverContent>
    </Popover>
  );
}
