'use client';

import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  UserRound
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ActionMenu } from '@repo/ui/components/action-menu';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { SearchField } from '@repo/ui/components/search-field';

import { useUserStore } from '@/stores/user-store';

import { BrandLogo } from './brand-logo';

type AppHeaderProps = {
  onOpenMobile: () => void;
};

export function AppHeader({ onOpenMobile }: AppHeaderProps): React.JSX.Element {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : 'User account';
  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : 'U';

  const handleLogout = async (): Promise<void> => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearUser();
      router.replace('/login');
      router.refresh();
    }
  };

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

        <ActionMenu
          ariaLabel="User menu"
          items={[
            {
              icon: UserRound,
              label: 'Profile',
              onSelect: () => router.push('/settings#profile'),
            },
            {
              icon: Settings,
              label: 'Settings',
              onSelect: () => router.push('/settings'),
            },
            {
              icon: LogOut,
              label: isLoggingOut ? 'Logout...' : 'Logout',
              onSelect: handleLogout,
              tone: 'danger',
            },
          ]}
          trigger={(isOpen) => (
            <button
              aria-expanded={isOpen}
              className="flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-secondary"
              type="button"
            >
              <Avatar className="size-7 bg-primary">
                <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-xs font-bold uppercase">
                  {fullName}
                </span>
                {user ? (
                  <span className="block truncate text-[0.65rem] leading-3 capitalize text-muted-foreground">
                    {user.role}
                  </span>
                ) : null}
              </span>
              <ChevronDown
                className={`hidden size-4 text-primary-700 transition-transform duration-200 sm:block ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        />
      </div>
    </header>
  );
}
