import { ArrowUp, type LucideIcon } from "lucide-react";

import { SparklineChart } from "@repo/ui/components/sparkline-chart";
import { cn } from "@repo/ui/lib/utils";

type MetricTone = "blue" | "cyan" | "red" | "teal";

export type MetricCardProps = {
  chartData: number[];
  change: string;
  changeLabel?: string;
  icon: LucideIcon;
  title: string;
  tone: MetricTone;
  trend?: "negative" | "positive";
  value: string;
};

const toneStyles: Record<
  MetricTone,
  { chart: string; icon: string; soft: string }
> = {
  blue: {
    chart: "#3b82f6",
    icon: "text-blue-600",
    soft: "bg-blue-50",
  },
  cyan: {
    chart: "#0891b2",
    icon: "text-cyan-700",
    soft: "bg-cyan-50",
  },
  red: {
    chart: "#ef4444",
    icon: "text-danger",
    soft: "bg-red-50",
  },
  teal: {
    chart: "#0d9488",
    icon: "text-teal-700",
    soft: "bg-teal-50",
  },
};

export function MetricCard({
  chartData,
  change,
  changeLabel = "vs yesterday",
  icon: Icon,
  title,
  tone,
  trend = "positive",
  value,
}: MetricCardProps): React.JSX.Element {
  const styles = toneStyles[tone];

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xs font-semibold text-ink-900">{title}</h2>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink-900">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            styles.soft,
            styles.icon,
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-0">
          <p
            className={cn(
              "flex items-center gap-0.6 text-[0.7rem] font-semibold",
              trend === "negative" ? "text-danger" : "text-teal-600",
            )}
          >
            <ArrowUp className="size-3" />
            {change}
          </p>
          <p className="text-[0.65rem] leading-2 text-primary-700">
            {changeLabel}
          </p>
        </div>
      </div>

      <SparklineChart
        className="mt-0 h-8 w-full"
        color={styles.chart}
        data={chartData}
        label={`${title} trend chart`}
        valueLabel={title}
      />
    </article>
  );
}
