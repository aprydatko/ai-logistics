'use client';

import { Bell, ChevronDown, Menu } from 'lucide-react';

import { Button } from '@repo/ui/components/button';
import { SearchField } from '@repo/ui/components/search-field';

import { BrandLogo } from './brand-logo';

type AppHeaderProps = {
  onOpenMobile: () => void;
};

export function AppHeader({ onOpenMobile }: AppHeaderProps): React.JSX.Element {
  return (
    <header className="z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/85 sm:px-6">
      <Button
        aria-label="Open navigation"
        className="lg:hidden"
        onClick={onOpenMobile}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Menu />
      </Button>

      <div className="lg:hidden">
        <BrandLogo size="sm" />
      </div>

      <SearchField
        className="hidden min-w-0 max-w-2xl flex-1 sm:block"
        label="Global Search"
        placeholder="Global Search"
      />

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Button
          aria-label="Notifications"
          className="relative text-primary-700"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Bell className="size-6" />
          <span className="absolute -right-[5px] -top-[2px] grid size-4 place-items-center rounded-full bg-danger text-[0.65rem] font-normal leading-none text-white">
            3
          </span>
        </Button>

        <div
          aria-hidden="true"
          className="hidden h-7 w-px shrink-0 bg-border sm:block"
        />

        <button
          className="flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-secondary"
          type="button"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            AD
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-xs font-bold">
              Alex Dispatcher
            </span>
          </span>
          <ChevronDown className="hidden size-4 text-primary-700 sm:block" />
        </button>
      </div>
    </header>
  );
}
