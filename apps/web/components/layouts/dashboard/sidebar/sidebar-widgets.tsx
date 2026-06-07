import { PlanCard, SystemHealthCard } from "@/components/shared";

type SidebarWidgetRoute = {
  match: (pathname: string) => boolean;
  widgets: React.ReactNode[];
};

const sidebarWidgetRoutes: SidebarWidgetRoute[] = [
  {
    match: (pathname) => pathname.startsWith("/drivers"),
    widgets: [
      <PlanCard key="plan" />,
      <SystemHealthCard key="system-health" />,
    ],
  },
];

export function getSidebarWidgets(pathname: string): React.ReactNode[] {
  return (
    sidebarWidgetRoutes.find((route) => route.match(pathname))?.widgets ?? []
  );
}
