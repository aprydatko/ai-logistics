import {
  AlertTriangle,
  FileUp,
  PackagePlus,
  UserRoundCheck,
} from "lucide-react";

import { Button } from "@repo/ui/components/button";

import { ActivityPanel } from "./activity-panel";
import { IncidentsPanel } from "./incidents-panel";
import { MapPlaceholder } from "./map-placeholder";
import { SuggestionsPanel } from "./suggestions-panel";

const quickActions = [
  { icon: UserRoundCheck, label: "Assign driver" },
  { icon: PackagePlus, label: "Create load" },
  { icon: AlertTriangle, label: "Report incident" },
  { icon: FileUp, label: "Upload document" },
];

function PanelTitle({
  action,
  children,
}: {
  action?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-sm font-bold text-ink-900">{children}</h2>
      {action ? (
        <Button className="h-auto p-0 text-blue-600" variant="link">
          {action}
        </Button>
      ) : null}
    </div>
  );
}

function QuickActionsPanel(): React.JSX.Element {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <PanelTitle>Quick actions</PanelTitle>
      <div className="mt-3 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {quickActions.map(({ icon: Icon, label }) => (
          <Button
            className="h-17 flex-col gap-2 rounded-lg text-ink-900"
            key={label}
            variant="outline"
          >
            <Icon className="size-5" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </article>
  );
}

export function DashboardPanels(): React.JSX.Element {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1.05fr_1fr]">
      <div className="grid gap-5">
        <MapPlaceholder />
        <ActivityPanel />
      </div>
      <div className="grid gap-5">
        <IncidentsPanel />
        <QuickActionsPanel />
        <SuggestionsPanel />
      </div>
    </div>
  );
}
