'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@repo/ui/lib/utils';

import { Popover, PopoverContent, PopoverTrigger } from './popover';

type ActionMenuItemTone = 'default' | 'danger';

export type ActionMenuItem = {
  icon: LucideIcon;
  label: string;
  onSelect?: () => void;
  tone?: ActionMenuItemTone;
};

type ActionMenuProps = {
  align?: React.ComponentProps<typeof PopoverContent>['align'];
  ariaLabel: string;
  className?: string;
  items: ActionMenuItem[];
  trigger: React.ReactNode | ((isOpen: boolean) => React.ReactNode);
};

const actionMenuItemToneStyles: Record<ActionMenuItemTone, string> = {
  danger: 'text-danger hover:bg-danger-background hover:text-danger',
  default: 'text-primary-700 hover:bg-accent hover:text-accent-foreground',
};

export function ActionMenu({
  align = 'end',
  ariaLabel,
  className,
  items,
  trigger,
}: ActionMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerNode =
    typeof trigger === 'function' ? trigger(isOpen) : trigger;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{triggerNode}</PopoverTrigger>
      <PopoverContent
        align={align}
        aria-label={ariaLabel}
        className={cn('w-48 p-1', className)}
        sideOffset={6}
      >
        <div className="flex flex-col gap-1">
          {items.map(({ icon: Icon, label, onSelect, tone = 'default' }) => (
            <button
              className={cn(
                'flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium transition-colors outline-none focus-visible:bg-accent focus-visible:text-accent-foreground',
                actionMenuItemToneStyles[tone]
              )}
              key={label}
              onClick={() => {
                onSelect?.();
                setIsOpen(false);
              }}
              type="button"
            >
              <Icon className="size-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
