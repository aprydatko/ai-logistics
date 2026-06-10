import { Siren } from "lucide-react";

import { StatusBadge } from "@repo/ui/components/status-badge";
import { cn } from "@repo/ui/lib/utils";

import type { Incident, IncidentPriority } from "../types";

export const incidentTabs = [
  "Overview",
  "AI Timeline",
  "Files",
  "Updates",
  "Activity",
] as const;

export type IncidentTab = (typeof incidentTabs)[number];

const priorityTone: Record<IncidentPriority, "danger" | "warning" | "info"> = {
  High: "danger",
  Medium: "warning",
  Low: "info",
};

type IncidentHeaderProps = {
  activeTab: IncidentTab;
  incident: Incident;
  onTabChange: (tab: IncidentTab) => void;
};

export const IncidentHeader = ({
  activeTab,
  incident,
  onTabChange,
}: IncidentHeaderProps): React.JSX.Element => (
  <div className="px-5 pt-5">
    <div className="flex items-center gap-4 px-2">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-danger-background text-danger">
        <Siren className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold text-ink-900">
              {incident.title}
            </h3>
            <p className="mt-1 truncate text-sm font-medium text-primary-700">
              {incident.location}
            </p>
          </div>
          <StatusBadge size="lg" tone={priorityTone[incident.priority]}>
            {incident.priority}
          </StatusBadge>
        </div>
      </div>
    </div>
    <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border">
      {incidentTabs.map((tab) => (
        <button
          className={cn(
            "shrink-0 border-b-2 px-2 pb-3 text-sm font-semibold",
            activeTab === tab
              ? "border-primary-700 text-primary-700"
              : "border-transparent text-primary-700/70",
          )}
          key={tab}
          onClick={() => onTabChange(tab)}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  </div>
);
