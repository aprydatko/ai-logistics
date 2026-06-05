'use client';

import {
  SidebarFooter,
  SidebarHeader,
  SidebarNavigation,
} from './sidebar';

type DashboardSidebarProps = {
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  showMobileClose?: boolean;
};

export function DashboardSidebar({
  isCollapsed,
  onCloseMobile,
  onToggleCollapse,
  showMobileClose = false,
}: DashboardSidebarProps): React.JSX.Element {
  return (
    <>
      <SidebarHeader
        isCollapsed={isCollapsed}
        onCloseMobile={onCloseMobile}
        showMobileClose={showMobileClose}
      />
      <SidebarNavigation
        isCollapsed={isCollapsed}
        onCloseMobile={onCloseMobile}
      />
      <SidebarFooter
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </>
  );
}
