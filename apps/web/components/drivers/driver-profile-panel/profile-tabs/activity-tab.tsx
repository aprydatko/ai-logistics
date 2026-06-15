import {
  Activity,
  BadgeCheck,
  FileText,
  Route,
  Truck,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";

import type { DriverDetails } from "@/lib/drivers/drivers-query";
import { StatusBadge } from "@repo/ui/components/status-badge";

import { EmptyTab, PanelSection } from "../panel-section";
import { formatTimestamp } from "../profile-formatters";

const activityConfig: Record<
  DriverDetails["activity"][number]["type"],
  {
    icon: LucideIcon;
    label: string;
    tone: "success" | "warning" | "danger";
  }
> = {
  created: {
    icon: BadgeCheck,
    label: "Created",
    tone: "success",
  },
  updated: {
    icon: UserRoundCog,
    label: "Updated",
    tone: "warning",
  },
  status_changed: {
    icon: Activity,
    label: "Status changed",
    tone: "warning",
  },
  document_added: {
    icon: FileText,
    label: "Document",
    tone: "success",
  },
  vehicle_assigned: {
    icon: Truck,
    label: "Truck",
    tone: "success",
  },
  trip_assigned: {
    icon: Route,
    label: "Trip assigned",
    tone: "warning",
  },
  trip_completed: {
    icon: BadgeCheck,
    label: "Trip completed",
    tone: "success",
  },
};

export const ActivityTab = ({
  details,
}: {
  details: DriverDetails;
}): React.JSX.Element => {
  if (!details.activity.length) return <EmptyTab label="Activity" />;

  return (
    <PanelSection title="Recent activity">
      <div className="divide-y divide-border/70 px-4">
        {details.activity.map((item) => {
          const config = activityConfig[item.type];
          const Icon = config.icon;

          return (
            <div className="flex items-start gap-3 py-3" key={item.id}>
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-100 text-primary-700">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={config.tone}>{config.label}</StatusBadge>
                  <p className="text-xs text-primary-700">
                    {formatTimestamp(item.createdAt)}
                  </p>
                </div>
                <p className="mt-2 text-sm font-medium text-ink-900">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </PanelSection>
  );
};
