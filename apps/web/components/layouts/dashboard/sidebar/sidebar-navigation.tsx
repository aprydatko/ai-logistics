'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@repo/ui/lib/utils';

import { dashboardNavigationItems } from '../dashboard-navigation';

type SidebarNavigationProps = {
  isCollapsed: boolean;
  onCloseMobile: () => void;
};

export function SidebarNavigation({
  isCollapsed,
  onCloseMobile,
}: SidebarNavigationProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'flex-1 space-y-1.5 px-5 py-5',
        isCollapsed && 'px-3 justify-center'
      )}
      aria-label="Main navigation"
    >
      {dashboardNavigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex h-9 items-center gap-3.5 rounded-md px-3 text-[13px] font-normal text-primary-700 transition-colors hover:bg-info-soft-background hover:text-info',
              isActive &&
                'bg-info-soft-background text-info font-semibold shadow-[inset_3px_0_0_var(--info)]',
              isCollapsed && 'justify-center px-0'
            )}
            href={item.href}
            key={item.href}
            onClick={onCloseMobile}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon className={cn('size-4 shrink-0', isActive && 'text-info')} />
            <span className={cn('truncate', isCollapsed && 'sr-only')}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
