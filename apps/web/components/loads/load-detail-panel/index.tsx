"use client";

import {
  ArrowRight,
  Ellipsis,
  FileUp,
  Package,
  Pencil,
  UserRoundPlus,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { RouteMap } from "@repo/ui/components/route-map";
import { SidePanel } from "@repo/ui/components/side-panel";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { cn } from "@repo/ui/lib/utils";

import { loadPriorityTone, loadStatusTone } from "../load-styles";
import type { Load } from "../types";
import { OverviewCard } from "./overview-card";

const tabs = [
  "Overview",
  "Timeline",
  "Route",
  "Documents",
  "Activity",
  "AI insights",
] as const;
type LoadTab = (typeof tabs)[number];

const detailActions = [
  { icon: UserRoundPlus, label: "Assign driver" },
  { icon: Pencil, label: "Edit load" },
  { icon: FileUp, label: "Upload document" },
  { icon: Ellipsis, label: "More" },
];

type LoadDetailPanelProps = {
  load: Load | null;
  onClose: () => void;
  onEdit: (load: Load) => void;
};

export const LoadDetailPanel = ({
  load,
  onClose,
  onEdit,
}: LoadDetailPanelProps): React.JSX.Element | null => {
  const [activeTab, setActiveTab] = React.useState<LoadTab>("Overview");

  React.useEffect(() => {
    if (load) setActiveTab("Overview");
  }, [load]);

  if (!load) return null;

  return (
    <SidePanel
      className="xl:w-[38rem]"
      isOpen
      mode="inline"
      onClose={onClose}
      title="Load detail"
    >
      <div className="px-5 pt-5">
        <div className="flex items-start gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-surface-100 text-primary-700">
            <Package className="size-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-ink-900">{load.id}</h3>
              <StatusBadge size="sm" tone={loadStatusTone[load.status]}>
                {load.status}
              </StatusBadge>
              {load.priority ? (
                <Badge
                  className={cn(
                    "ml-auto",
                    loadPriorityTone[load.priority] === "danger" &&
                      "border-transparent bg-danger-background text-danger",
                    loadPriorityTone[load.priority] === "warning" &&
                      "border-transparent bg-warning-background text-warning",
                    loadPriorityTone[load.priority] === "info" &&
                      "border-transparent bg-info-background text-info",
                  )}
                >
                  {load.priority}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-primary-700">{load.description}</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-primary-700">
              <span>{load.route.origin}</span>
              <ArrowRight className="size-4" />
              <span>{load.route.destination}</span>
            </p>
            <p className="mt-1 text-xs text-primary-700">
              ETA: {load.eta ? `${load.eta.date}, ${load.eta.time}` : "Not set"}
              <span className="mx-2 text-border">|</span>
              Distance: {load.details.distance}
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-3 overflow-x-auto border-b border-border">
          {tabs.map((tab) => (
            <button
              className={cn(
                "shrink-0 border-b-2 px-1 pb-3 text-xs font-semibold",
                activeTab === tab
                  ? "border-primary-700 text-primary-700"
                  : "border-transparent text-primary-700/70",
              )}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Overview" ? (
        <div className="pb-5">
          <div className="grid grid-cols-2 gap-2 px-5 pt-4 sm:grid-cols-3">
            <OverviewCard label="Status">
              <StatusBadge size="sm" tone={loadStatusTone[load.status]}>
                {load.status}
              </StatusBadge>
            </OverviewCard>
            <OverviewCard label="Driver">
              {load.driver?.name ?? "Unassigned"}
              <p className="mt-1 text-xs font-normal text-primary-700">
                {load.driver?.truckId ?? "-"}
              </p>
            </OverviewCard>
            <OverviewCard label="Truck">
              {load.driver?.truckId ?? "-"}
              <p className="mt-1 text-xs font-normal text-primary-700">
                {load.details.truckModel ?? "Not assigned"}
              </p>
            </OverviewCard>
            <OverviewCard label="Weight">{load.details.weight}</OverviewCard>
            <OverviewCard label="Cargo">{load.description}</OverviewCard>
            <OverviewCard label="Priority">
              {load.priority ?? "Not set"}
            </OverviewCard>
          </div>

          <section className="mx-5 mt-4 rounded-md border border-border/70 p-4">
            <h4 className="text-sm font-bold text-ink-900">Details</h4>
            <dl className="mt-4 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-3 text-xs sm:grid-cols-[5.5rem_1fr_5.5rem_1fr]">
              {[
                ["Load ID", load.id],
                ["Contact", load.details.contact],
                ["Customer", load.details.customer],
                ["Reference", load.details.reference],
                ["Created", load.details.created],
                ["Temperature", load.details.temperature],
              ].map(([label, value]) => (
                <React.Fragment key={label}>
                  <dt className="text-primary-700">{label}</dt>
                  <dd className="font-medium text-ink-900">{value}</dd>
                </React.Fragment>
              ))}
            </dl>
          </section>

          <section className="mx-5 mt-4 rounded-md border border-border/70 p-4">
            <h4 className="mb-4 text-sm font-bold text-ink-900">
              Route preview
            </h4>
            <RouteMap
              center={load.map.center}
              className="h-52 min-h-52 rounded-md"
              markers={[
                {
                  coordinates: load.map.route[0]!,
                  id: "origin",
                  label: load.route.origin,
                },
                {
                  coordinates: load.map.route.at(-1)!,
                  id: "destination",
                  label: load.route.destination,
                },
              ]}
              route={load.map.route}
              zoom={6}
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-ink-900">
                  {load.route.origin}
                </p>
                <p className="mt-1 text-xs text-primary-700">
                  {load.schedule.origin}
                </p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-primary-700" />
              <div className="text-right">
                <p className="text-xs font-semibold text-ink-900">
                  {load.route.destination}
                </p>
                <p className="mt-1 text-xs text-primary-700">
                  {load.schedule.destination}
                </p>
              </div>
            </div>
          </section>

          <section className="mx-5 mt-4">
            <h4 className="text-sm font-bold text-ink-900">Quick actions</h4>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {detailActions.map(({ icon: Icon, label }) => (
                <Button
                  className="h-20 flex-col gap-2 px-2 text-xs"
                  key={label}
                  onClick={() => {
                    if (label === "Edit load") onEdit(load);
                  }}
                  type="button"
                  variant="outline"
                >
                  <Icon className="size-5" />
                  {label}
                </Button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="mx-5 mt-5 rounded-md border border-dashed border-border p-10 text-center text-sm text-primary-700">
          No {activeTab.toLowerCase()} information is available.
        </div>
      )}
    </SidePanel>
  );
};
