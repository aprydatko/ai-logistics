'use client';

import type { User } from '@repo/shared';
import { useEffect, useState } from 'react';

import { cn } from '@repo/ui/lib/utils';

import { useUserStore } from '@/stores/user-store';

import { AppHeader } from './app-header';
import { DashboardSidebar } from './dashboard-sidebar';

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({
  children,
}: DashboardShellProps): React.JSX.Element {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    if (user) return;

    const controller = new AbortController();

    void fetch('/api/auth/me', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          clearUser();
          return;
        }

        const body = (await response.json()) as { user: User };
        setUser(body.user);
      })
      .catch(() => {
        if (!controller.signal.aborted) clearUser();
      });

    return () => controller.abort();
  }, [clearUser, setUser, user]);

  const closeMobileNavigation = (): void => setIsMobileOpen(false);
  const toggleSidebar = (): void => setIsCollapsed((value) => !value);

  return (
    <div className="h-svh overflow-hidden bg-surface-50 text-ink-900">
      {isMobileOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-ink-900/35 lg:hidden"
          onClick={closeMobileNavigation}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-card shadow-xl transition-transform duration-300 lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <DashboardSidebar
          isCollapsed={false}
          onCloseMobile={closeMobileNavigation}
          onToggleCollapse={toggleSidebar}
          showMobileClose
        />
      </aside>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-card transition-[width] duration-300 lg:flex',
          isCollapsed ? 'w-16' : 'w-56'
        )}
      >
        <DashboardSidebar
          isCollapsed={isCollapsed}
          onCloseMobile={closeMobileNavigation}
          onToggleCollapse={toggleSidebar}
        />
      </aside>

      <div
        className={cn(
          'flex h-svh min-h-0 flex-col transition-[padding] duration-300',
          isCollapsed ? 'lg:pl-16' : 'lg:pl-56'
        )}
      >
        <AppHeader onOpenMobile={() => setIsMobileOpen(true)} />
        <main className="mx-auto min-h-0 w-full max-w-[112rem] flex-1 overflow-y-auto p-4 lg:pt-5 lg:pl-6">
          {children}
        </main>
      </div>
    </div>
  );
}
