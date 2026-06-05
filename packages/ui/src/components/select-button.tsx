'use client';

import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

type SelectButtonOption = {
  label: string;
  value: string;
};

type SelectButtonProps = React.ComponentProps<typeof Select> & {
  className?: string;
  options: SelectButtonOption[];
  placeholder: string;
  triggerClassName?: string;
};

export function SelectButton({
  className,
  options,
  placeholder,
  triggerClassName,
  ...props
}: SelectButtonProps): React.JSX.Element {
  return (
    <Select {...props}>
      <SelectTrigger
        className={cn(
          'h-11 rounded-lg border-border bg-card px-4 text-primary-700 shadow-none hover:bg-surface-50',
          className,
          triggerClassName
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
