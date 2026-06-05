'use client';

import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';

import { Button } from './button';

type SidePanelProps = React.ComponentProps<'aside'> & {
  isOpen: boolean;
  mode?: 'fixed' | 'inline';
  onClose: () => void;
  title: string;
};

export function SidePanel({
  children,
  className,
  isOpen,
  mode = 'fixed',
  onClose,
  title,
  ...props
}: SidePanelProps): React.JSX.Element | null {
  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      aria-label={title}
      className={cn(
        'flex w-[min(35rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-border bg-card',
        mode === 'fixed'
          ? 'fixed top-3 right-3 bottom-3 z-50 shadow-xl'
          : 'min-h-0 shrink-0 shadow-sm',
        className
      )}
      {...props}
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <h2 className="text-xl font-bold text-ink-900">{title}</h2>
        <Button
          aria-label="Close panel"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <X className="size-5" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb:hover]:bg-primary-600">
        {children}
      </div>
    </aside>
  );
}
