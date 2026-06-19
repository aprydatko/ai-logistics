"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown } from "lucide-react";

import { useIncidentTimelineLive } from "@/lib/incidents/incident-timeline-live";
import {
  incidentQueryOptions,
  incidentTimelineQueryOptions,
} from "@/lib/incidents/incidents-query";
import { Button } from "@repo/ui/components/button";
import { StatusBadge } from "@repo/ui/components/status-badge";

import { incidentPriorityLabels, incidentStatusLabels } from "../types";
import { IncidentDetailFacts } from "./incident-detail-facts";
import { IncidentDetailPanel } from "./incident-detail-panel";
import { IncidentDetailSkeleton } from "./incident-detail-skeleton";
import { IncidentDetailTimeline } from "./incident-detail-timeline";
import {
  formatDateTime,
  priorityTone,
  statusTone,
  type IncidentDetailPageProps,
} from "./incident-detail-view-model";

export const IncidentDetailPage = ({
  incidentId,
}: IncidentDetailPageProps): React.JSX.Element => {
  const incidentQuery = useQuery(incidentQueryOptions(incidentId));
  const timelineQuery = useQuery(incidentTimelineQueryOptions(incidentId));
  const liveState = useIncidentTimelineLive(
    incidentId,
    Boolean(incidentQuery.data),
  );

  if (incidentQuery.isPending) return <IncidentDetailSkeleton />;

  if (incidentQuery.isError) {
    return (
      <main className="space-y-5">
        <Button asChild className="-ml-3 text-primary-700" size="sm" variant="ghost">
          <Link href="/incidents">
            <ChevronDown className="size-4 rotate-90" />
            Back to incidents
          </Link>
        </Button>
        <section className="rounded-xl border border-border bg-card p-8 text-center shadow-xs">
          <AlertTriangle className="mx-auto size-8 text-danger" />
          <h1 className="mt-4 text-xl font-bold text-ink-900">
            Unable to load incident
          </h1>
          <p className="mt-2 text-sm text-primary-700">
            The incident was not found or the API is unavailable.
          </p>
        </section>
      </main>
    );
  }

  const incident = incidentQuery.data;
  const timelineItems = timelineQuery.data?.items ?? incident.timeline;

  return (
    <main className="space-y-5">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Button asChild className="-ml-3 text-primary-700" size="sm" variant="ghost">
            <Link href="/incidents">
              <ChevronDown className="size-4 rotate-90" />
              Back to incidents
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-normal text-ink-900">
                {incident.title}
              </h1>
              <StatusBadge tone={statusTone[incident.status]}>
                {incidentStatusLabels[incident.status]}
              </StatusBadge>
            </div>
            <p className="text-sm font-medium text-primary-700">
              {incident.load.referenceNumber}{" "}
              <span className="mx-2 text-primary-300">•</span>
              Occurred {formatDateTime(incident.occurredAt)}
              <span className="mx-2 text-primary-300">•</span>
              Updated {formatDateTime(incident.updatedAt)}
            </p>
          </div>
        </div>

        <StatusBadge size="lg" tone={priorityTone[incident.priority]}>
          {incidentPriorityLabels[incident.priority]} priority
        </StatusBadge>
      </header>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <IncidentDetailPanel title="Report details">
          <IncidentDetailFacts incident={incident} />
        </IncidentDetailPanel>
        <IncidentDetailPanel title="Ticket information">
          <dl className="space-y-5">
            <MetaRow label="Status">
              <StatusBadge tone={statusTone[incident.status]}>
                {incidentStatusLabels[incident.status]}
              </StatusBadge>
            </MetaRow>
            <MetaRow label="Priority">
              <StatusBadge tone={priorityTone[incident.priority]}>
                {incidentPriorityLabels[incident.priority]}
              </StatusBadge>
            </MetaRow>
            <MetaRow label="Created">{formatDateTime(incident.createdAt)}</MetaRow>
            <MetaRow label="Last updated">
              {formatDateTime(incident.updatedAt)}
            </MetaRow>
            {incident.resolvedAt ? (
              <MetaRow label="Resolved">
                {formatDateTime(incident.resolvedAt)}
              </MetaRow>
            ) : null}
          </dl>
        </IncidentDetailPanel>
      </section>

      <IncidentDetailPanel
        action={
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {liveState === "connected" ? "Live" : "Polling"}
          </span>
        }
        title="Incident timeline"
      >
        <IncidentDetailTimeline items={timelineItems} />
      </IncidentDetailPanel>
    </main>
  );
};

const MetaRow = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}): React.JSX.Element => (
  <div className="flex items-center justify-between gap-4">
    <dt className="text-sm font-medium text-primary-600">{label}</dt>
    <dd className="text-right text-sm font-bold text-ink-900">{children}</dd>
  </div>
);
