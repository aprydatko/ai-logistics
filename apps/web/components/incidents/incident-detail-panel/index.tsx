"use client";

import * as React from "react";

import { SidePanel } from "@repo/ui/components/side-panel";

import type { Incident } from "../types";
import { IncidentActions, IncidentSummary } from "./incident-actions";
import { IncidentHeader, type IncidentTab } from "./incident-header";
import { IncidentTimeline } from "./incident-timeline";

type IncidentDetailPanelProps = {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
};

const IncidentTabPlaceholder = ({
  tab,
}: {
  tab: Exclude<IncidentTab, "AI Timeline">;
}): React.JSX.Element => (
  <div className="mx-5 my-6 rounded-md border border-dashed border-border p-8 text-center">
    <p className="text-sm font-semibold text-ink-900">{tab}</p>
    <p className="mt-2 text-sm text-primary-700">
      Incident {tab.toLowerCase()} data will be connected to the API.
    </p>
  </div>
);

export const IncidentDetailPanel = ({
  incident,
  isOpen,
  onClose,
}: IncidentDetailPanelProps): React.JSX.Element | null => {
  const [activeTab, setActiveTab] = React.useState<IncidentTab>("AI Timeline");

  React.useEffect(() => {
    if (isOpen) setActiveTab("AI Timeline");
  }, [incident?.id, isOpen]);

  if (!incident) return null;

  return (
    <SidePanel
      className="w-[min(40rem,calc(100vw-1.5rem))]"
      isOpen={isOpen}
      mode="inline"
      onClose={onClose}
      title="Incident detail"
    >
      <IncidentHeader
        activeTab={activeTab}
        incident={incident}
        onTabChange={setActiveTab}
      />
      {activeTab === "AI Timeline" ? (
        <>
          <IncidentTimeline items={incident.timeline} />
          <IncidentSummary incident={incident} />
        </>
      ) : (
        <IncidentTabPlaceholder tab={activeTab} />
      )}
      <IncidentActions incident={incident} />
    </SidePanel>
  );
};
