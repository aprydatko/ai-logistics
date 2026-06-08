import { Mail } from "lucide-react";

import type { DriverDetails } from "@/lib/drivers/drivers-query";
import { DriverAvatar } from "@repo/ui/components/avatar";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { cn } from "@repo/ui/lib/utils";

import { driverStatusTone } from "../driver-styles";
import type { DriverRow } from "../types";

export const profileTabs = [
  "Profile",
  "Truck",
  "Info",
  "Docs",
  "Trips",
  "Activity",
] as const;

export type ProfileTab = (typeof profileTabs)[number];

export const ProfileHeader = ({
  activeTab,
  details,
  driver,
  onTabChange,
}: {
  activeTab: ProfileTab;
  details?: DriverDetails;
  driver: DriverRow;
  onTabChange: (tab: ProfileTab) => void;
}): React.JSX.Element => (
  <div className="px-5 pt-5">
    <div className="flex items-start gap-6 px-2">
      <DriverAvatar imageUrl={driver.avatarUrl} name={driver.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold leading-none text-ink-900">
              {driver.name}
            </h3>
            <p className="mt-3 font-medium text-primary-700">ID: {driver.id}</p>
          </div>
          <StatusBadge size="lg" tone={driverStatusTone[driver.status]}>
            {driver.status}
          </StatusBadge>
        </div>
        {details?.phone ? (
          <p className="mt-2 text-primary-700">{details.phone}</p>
        ) : null}
        {details?.email ? (
          <div className="flex items-center gap-2 text-info">
            <span className="truncate">{details.email}</span>
            <Mail className="size-4 shrink-0" />
          </div>
        ) : null}
      </div>
    </div>
    <div className="mt-6 flex gap-3 overflow-x-auto border-b border-border">
      {profileTabs.map((tab) => (
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
