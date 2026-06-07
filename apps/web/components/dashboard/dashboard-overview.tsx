import { CircleAlert, Clock3, Truck, UserRound } from "lucide-react";

import { DashboardPanels } from "./dashboard-panels";
import { MetricCard, type MetricCardProps } from "./metric-card";

const metrics: MetricCardProps[] = [
  {
    chartData: [62, 66, 63, 69, 76, 68, 73, 79, 75, 82, 80, 91],
    change: "+12.5%",
    icon: Truck,
    title: "Active loads",
    tone: "teal",
    value: "1,248",
  },
  {
    chartData: [48, 55, 51, 50, 57, 62, 56, 61, 64, 72, 68, 78],
    change: "+8.1%",
    icon: UserRound,
    title: "Available drivers",
    tone: "blue",
    value: "842",
  },
  {
    chartData: [12, 13, 11, 15, 20, 14, 18, 16, 19, 17, 28, 23],
    change: "+15.3%",
    icon: CircleAlert,
    title: "Open incidents",
    trend: "negative",
    tone: "red",
    value: "23",
  },
  {
    chartData: [82, 85, 83, 87, 84, 88, 86, 89, 87, 92, 94, 91],
    change: "+3.2%",
    icon: Clock3,
    title: "Today deliveries",
    tone: "cyan",
    value: "91.4%",
  },
];

export function DashboardOverview(): React.JSX.Element {
  return (
    <section className="space-y-5 pb-8">
      <header>
        <h1 className="text-2xl leading-9 text-ink-900">Dashboard Overview</h1>
        <p className="max-w-2xl text-sm text-primary-700">
          KPI cards, critical incidents first, quick actions, recent activity.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <DashboardPanels />
    </section>
  );
}
