"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { dashboardActivityQueryOptions } from "@/lib/dashboard/activity-query";
import { DashboardMotionItem } from "./dashboard-motion";
import {
  DashboardPanelMessageSkeleton,
  DashboardTimelineSkeleton,
} from "./dashboard-skeleton";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";

export function ActivityPanel(): React.JSX.Element {
  const router = useRouter();
  const { data, isError, isLoading } = useQuery(
    dashboardActivityQueryOptions(),
  );
  const activities = data?.activities ?? [];
  const hasActivities = activities.length > 0;

  return (
    <DashboardMotionItem>
      <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-ink-900">Recent activity</h2>
            <p className="mt-1 text-xs text-primary-700">
              Latest load and incident updates across the platform.
            </p>
          </div>
          <Button
            className="h-auto p-0 text-xs text-blue-600"
            onClick={() => router.push("/ai-logs")}
            type="button"
            variant="link"
          >
            View all
          </Button>
        </div>
        <div className="mt-3">
          {isLoading ? <DashboardTimelineSkeleton /> : null}
          {isError ? (
            <p className="rounded-sm bg-surface-50 p-3 text-sm text-danger">
              Unable to load recent activity right now.
            </p>
          ) : null}
          {!isLoading && !isError && !hasActivities ? (
            <div className="rounded-sm bg-surface-50 p-3">
              <DashboardPanelMessageSkeleton />
              <p className="mt-3 text-sm text-primary-700">
                No recent activity available.
              </p>
            </div>
          ) : null}
          {hasActivities ? (
            <ul className="space-y-3" aria-label="Recent dashboard activity">
              {activities.map((activity, index) => (
                <li className="relative flex gap-4" key={activity.id}>
                  {index < activities.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-[7px] top-5 h-[calc(100%-0.25rem)] w-px bg-blue-400"
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="relative z-10 mt-1 size-4 shrink-0 rounded-full border-2 border-blue-500 bg-card"
                  />
                  <div className="min-w-0 flex-1 border-b border-secondary pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <Badge
                        className="bg-surface-100 text-primary-700"
                        size="sm"
                        variant="secondary"
                      >
                        {activity.label}
                      </Badge>
                      <time
                        className="shrink-0 text-xs text-primary-700"
                        dateTime={activity.updatedAt}
                      >
                        {activity.time}
                      </time>
                    </div>
                    <p className="mt-2 text-xs font-medium text-ink-900">
                      {activity.title}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] text-primary-700">
                      {activity.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    </DashboardMotionItem>
  );
}
