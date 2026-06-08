"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { driverDetailsQueryOptions } from "@/lib/drivers/drivers-query";
import { SidePanel } from "@repo/ui/components/side-panel";

import type { DriverRow } from "../types";
import { EmptyTab } from "./panel-section";
import { ProfileHeader, type ProfileTab } from "./profile-header";
import { ProfilePanelSkeleton } from "./profile-panel-skeleton";
import { ProfileTabContent } from "./profile-tabs";

type DriverProfilePanelProps = {
  driver: DriverRow | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (driver: DriverRow) => void;
};

export const DriverProfilePanel = ({
  driver,
  isOpen,
  onClose,
  onEdit,
}: DriverProfilePanelProps): React.JSX.Element | null => {
  const [activeTab, setActiveTab] = React.useState<ProfileTab>("Profile");
  const driverId = driver?.source?.id ?? "";
  const detailsQuery = useQuery(driverDetailsQueryOptions(driverId));

  React.useEffect(() => {
    if (isOpen) setActiveTab("Profile");
  }, [driverId, isOpen]);

  if (!driver) return null;

  return (
    <SidePanel
      isOpen={isOpen}
      mode="inline"
      onClose={onClose}
      title="Driver profile"
    >
      <ProfileHeader
        activeTab={activeTab}
        details={detailsQuery.data}
        driver={driver}
        onTabChange={setActiveTab}
      />
      {detailsQuery.isPending ? <ProfilePanelSkeleton /> : null}
      {detailsQuery.isError ? <EmptyTab label="Driver details" /> : null}
      {detailsQuery.data ? (
        <ProfileTabContent
          activeTab={activeTab}
          details={detailsQuery.data}
          driver={driver}
          onEdit={onEdit}
        />
      ) : null}
    </SidePanel>
  );
};
