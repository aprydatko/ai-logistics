import { ArrowDown, ArrowUp } from "lucide-react";

import { SparklineChart } from "@repo/ui/components/sparkline-chart";

import type { AiLogMetricCard } from "../ai-logs-data";

type Props = {
  isLoading: boolean;
  metrics: AiLogMetricCard[];
};

const metricSkeletons = Array.from({ length: 5 }, (_, index) => index);

export const AiLogsMetrics = ({
  isLoading,
  metrics,
}: Props): React.JSX.Element => (
  <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
    {isLoading && metrics.length === 0
      ? metricSkeletons.map((item) => (
          <article
            className="rounded-xl border border-border bg-card p-4 shadow-xs"
            key={item}
          >
            <div className="h-3 w-24 animate-pulse rounded bg-surface-100" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-surface-100" />
            <div className="mt-3 h-3 w-28 animate-pulse rounded bg-surface-100" />
          </article>
        ))
      : metrics.map((metric) => {
          const TrendIcon = metric.direction === "up" ? ArrowUp : ArrowDown;

          return (
            <article
              className="rounded-xl border border-border bg-card p-4 shadow-xs"
              key={metric.title}
            >
              <p className="text-xs font-semibold text-ink-500">
                {metric.title}
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold tracking-tight">
                    {metric.value}
                  </p>
                  <p
                    className={
                      metric.favorable
                        ? "mt-2 flex items-center text-xs font-semibold text-teal-600"
                        : "mt-2 flex items-center text-xs font-semibold text-danger"
                    }
                  >
                    <TrendIcon className="mr-1 size-3" />
                    {metric.change}{" "}
                    <span className="ml-1 font-normal text-ink-500">
                      vs yesterday
                    </span>
                  </p>
                </div>
                <SparklineChart
                  className="h-12 w-24"
                  color={metric.color}
                  data={[...metric.data]}
                  label={`${metric.title} trend`}
                />
              </div>
            </article>
          );
        })}
  </div>
);
