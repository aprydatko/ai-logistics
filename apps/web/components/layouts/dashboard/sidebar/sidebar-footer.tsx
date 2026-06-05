'use client';

import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';

import { getSidebarWidgets } from './sidebar-widgets';

type SidebarFooterProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
};

const shouldRenderSidebarWidgets = false;

export function SidebarFooter({
  isCollapsed,
  onToggleCollapse,
}: SidebarFooterProps): React.JSX.Element {
  return (
    <footer className="mt-auto">
      {shouldRenderSidebarWidgets ? <SidebarWidgetSlot /> : null}

      <div className={cn('border-t px-5 py-5', isCollapsed && 'px-3')}>
        <Button
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(isCollapsed && 'justify-center px-0')}
          onClick={onToggleCollapse}
          type="button"
          variant="ghost"
        >
          {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
          <span className={cn('text-xs', isCollapsed && 'sr-only')}>
            Collapse
          </span>
        </Button>
      </div>
    </footer>
  );
}

function SidebarWidgetSlot(): React.JSX.Element | null {
  const pathname = usePathname();
  const widgets = getSidebarWidgets(pathname);

  if (widgets.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pb-5">
      <div className="border-y border-border bg-surface-0">{widgets}</div>
    </div>
  );
}
