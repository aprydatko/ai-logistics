"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Clock3,
  Fuel,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";

import {
  incidentsQueryOptions,
  incidentTimelineQueryOptions,
  type IncidentApiItem,
  type IncidentTimelineEvent,
} from "@/lib/incidents/incidents-query";
import { useIncidentTimelineLive } from "@/lib/incidents/incident-timeline-live";
import {
  incidentPriorityLabels,
  incidentStatusLabels,
} from "@/components/incidents/types";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { useRouter } from "next/navigation";
import { DashboardMotionItem } from "./dashboard-motion";
import {
  DashboardPanelMessageSkeleton,
  DashboardTimelineSkeleton,
} from "./dashboard-skeleton";

const dashboardTimelineFilters = {
  search: "",
  priority: "all" as const,
  status: "all" as const,
  occurredFrom: "",
  occurredTo: "",
  page: 1,
  limit: 6,
};

const timelineTypeIcons: Record<string, typeof Sparkles> = {
  accident: ShieldAlert,
  ai_update: Sparkles,
  delay: Clock3,
  flat_tire: Truck,
  fuel_issue: Fuel,
  maintenance: Wrench,
  monitoring: ScanSearch,
  other: Sparkles,
};

const priorityBadgeStyles: Record<IncidentApiItem["priority"], string> = {
  critical: "bg-red-50 text-danger",
  high: "bg-orange-50 text-orange-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-blue-50 text-blue-700",
};

const toneStyles: Record<
  IncidentTimelineEvent["tone"],
  { dot: string; line: string; icon: string; surface: string }
> = {
  blue: {
    dot: "border-blue-500 bg-blue-500",
    line: "bg-blue-200",
    icon: "text-blue-600",
    surface: "from-blue-50 to-white",
  },
  green: {
    dot: "border-emerald-500 bg-emerald-500",
    line: "bg-emerald-200",
    icon: "text-emerald-600",
    surface: "from-emerald-50 to-white",
  },
  red: {
    dot: "border-red-500 bg-red-500",
    line: "bg-red-200",
    icon: "text-danger",
    surface: "from-red-50 to-white",
  },
};

const formatTimestamp = (value: string): string => {
  const normalizedValue = Number.isNaN(Date.parse(value))
    ? value.replaceAll('"', "")
    : value;
  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
};

const getFeaturedIncident = (
  incidents: IncidentApiItem[],
): IncidentApiItem | null =>
  [...incidents].sort((left, right) => {
    const priorityWeight = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    const priorityDelta =
      priorityWeight[right.priority] - priorityWeight[left.priority];
    if (priorityDelta !== 0) return priorityDelta;

    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  })[0] ?? null;

export function AiTimelinePanel(): React.JSX.Element {
  const router = useRouter();
  const incidentsQuery = useQuery(
    incidentsQueryOptions(dashboardTimelineFilters),
  );
  const featuredIncident = getFeaturedIncident(incidentsQuery.data?.data ?? []);
  const liveState = useIncidentTimelineLive(
    featuredIncident?.id ?? null,
    Boolean(featuredIncident),
  );

  const timelineQuery = useQuery({
    ...incidentTimelineQueryOptions(featuredIncident?.id ?? ""),
    enabled: Boolean(featuredIncident?.id),
    refetchInterval: liveState === "polling" ? 15_000 : false,
    staleTime: liveState === "polling" ? 10_000 : Infinity,
  });

  if (incidentsQuery.isError) {
    return (
      <DashboardMotionItem transition={{ delay: 0.02 }}>
        <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <h2 className="text-sm font-bold text-ink-900">AI timeline</h2>
          <p className="mt-3 text-sm text-danger">
            Unable to load the featured incident timeline right now.
          </p>
        </article>
      </DashboardMotionItem>
    );
  }

  if (incidentsQuery.isLoading) {
    return (
      <DashboardMotionItem transition={{ delay: 0.02 }}>
        <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <h2 className="text-sm font-bold text-ink-900">AI timeline</h2>
          <div className="mt-3">
            <DashboardTimelineSkeleton />
          </div>
        </article>
      </DashboardMotionItem>
    );
  }

  if (!featuredIncident) {
    return (
      <DashboardMotionItem transition={{ delay: 0.02 }}>
        <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <h2 className="text-sm font-bold text-ink-900">AI timeline</h2>
          <div className="mt-3 rounded-sm bg-surface-50 p-3">
            <DashboardPanelMessageSkeleton />
            <p className="mt-3 text-sm text-primary-700">
              No incidents are available for live timeline tracking yet.
            </p>
          </div>
        </article>
      </DashboardMotionItem>
    );
  }

  const timelineItems = timelineQuery.data?.items ?? [];

  return (
    <DashboardMotionItem transition={{ delay: 0.02 }}>
      <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-ink-900">AI timeline</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[0.65rem] font-semibold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {liveState === "connected"
                  ? "Live"
                  : liveState === "connecting"
                    ? "Connecting"
                    : "Polling fallback"}
              </span>
            </div>
            <p className="mt-1 text-xs text-primary-700">
              Tracking {featuredIncident.title} for load #
              {featuredIncident.load.referenceNumber}.
            </p>
          </div>
          <Button
            className="h-auto p-0 text-blue-600"
            onClick={() => router.push(`/incidents/${featuredIncident.id}`)}
            variant="link"
          >
            Open incident
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.65rem] font-semibold",
              priorityBadgeStyles[featuredIncident.priority],
            )}
          >
            {incidentPriorityLabels[featuredIncident.priority]}
          </span>
          <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[0.65rem] font-semibold text-primary-700">
            {incidentStatusLabels[featuredIncident.status]}
          </span>
          <span className="text-[0.65rem] text-primary-700">
            Updated{" "}
            {formatTimestamp(
              timelineQuery.data?.updatedAt ?? featuredIncident.updatedAt,
            )}
          </span>
        </div>

        {timelineQuery.isError ? (
          <p className="mt-4 text-sm text-danger">
            Unable to refresh timeline events right now.
          </p>
        ) : null}

        {!timelineQuery.isError && timelineQuery.isLoading ? (
          <div className="mt-4">
            <DashboardTimelineSkeleton />
          </div>
        ) : null}

        {!timelineQuery.isError &&
        !timelineQuery.isLoading &&
        timelineItems.length === 0 ? (
          <div className="mt-4 rounded-sm bg-surface-50 p-3">
            <DashboardPanelMessageSkeleton />
            <p className="mt-3 text-sm text-primary-700">
              No timeline events yet for this incident.
            </p>
          </div>
        ) : null}

        {!timelineQuery.isError && timelineItems.length > 0 ? (
          <div className="mt-4 space-y-3">
            {timelineItems.slice(0, 4).map((item, index) => {
              const Icon = timelineTypeIcons[item.type] ?? Sparkles;
              const tone = toneStyles[item.tone];

              return (
                <motion.div
                  className="relative flex gap-4"
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.24,
                    ease: "easeOut",
                    delay: index * 0.04,
                  }}
                >
                  {index < Math.min(timelineItems.length, 4) - 1 ? (
                    <span
                      className={cn(
                        "absolute top-10 bottom-[-16px] left-[17px] w-px",
                        tone.line,
                      )}
                    />
                  ) : null}
                  <div className="relative z-10 mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-card bg-card shadow-[0_0_0_4px_var(--card)]">
                    <span
                      className={cn(
                        "absolute inset-1 rounded-full opacity-15",
                        item.tone === "blue" && "bg-blue-500",
                        item.tone === "green" && "bg-emerald-500",
                        item.tone === "red" && "bg-red-500",
                      )}
                    />
                    <span
                      className={cn(
                        "absolute size-3 rounded-full border-2",
                        tone.dot,
                      )}
                    />
                    <Icon className={cn("relative z-10 size-4", tone.icon)} />
                  </div>

                  <div
                    className={cn(
                      "min-w-0 flex-1 rounded-2xl border border-border bg-gradient-to-r p-3",
                      tone.surface,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-primary-700">
                          {formatTimestamp(item.dateTime)}
                        </p>
                      </div>
                      <span className="rounded-full bg-card px-2 py-1 text-[0.65rem] font-semibold text-primary-700">
                        {item.type.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-primary-700">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : null}
      </article>
    </DashboardMotionItem>
  );
}
