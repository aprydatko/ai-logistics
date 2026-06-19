"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CircleAlert,
  Clock3,
  PackageCheck,
  Truck,
  TruckIcon,
} from "lucide-react";

import { loadMetricsQueryOptions } from "@/lib/dashboard/load-metrics-query";
import { DashboardPanels } from "./dashboard-panels";
import { MetricCard, type MetricCardProps } from "./metric-card";

const fallbackMetrics: MetricCardProps[] = [
  {
    chartData: [0, 0, 0, 0, 0],
    change: "--",
    changeLabel: "Loading loads",
    icon: Truck,
    title: "Active loads",
    tone: "teal",
    value: "—",
  },
  {
    chartData: [0, 0, 0, 0, 0],
    change: "--",
    changeLabel: "Loading loads",
    icon: TruckIcon,
    title: "Pending loads",
    tone: "blue",
    value: "—",
  },
  {
    chartData: [0, 0, 0, 0, 0],
    change: "--",
    changeLabel: "Loading loads",
    icon: PackageCheck,
    title: "Delivered loads",
    tone: "red",
    value: "—",
  },
  {
    chartData: [0, 0, 0, 0, 0],
    change: "--",
    changeLabel: "Loading loads",
    icon: Clock3,
    title: "Cancelled loads",
    tone: "cyan",
    value: "—",
  },
];

export function DashboardOverview(): React.JSX.Element {
  const { data, isError } = useQuery(loadMetricsQueryOptions());

  const metricIcons: MetricCardProps["icon"][] = [
    Truck,
    TruckIcon,
    PackageCheck,
    CircleAlert,
  ];
  const metricTones: MetricCardProps["tone"][] = [
    "teal",
    "blue",
    "cyan",
    "red",
  ];

  const metrics = data
    ? data.metrics.map((metric, index) => ({
        ...metric,
        changeLabel: "of all loads",
        icon: metricIcons[index] ?? Truck,
        tone: metricTones[index] ?? "teal",
      }))
    : fallbackMetrics;

  return (
    <section className="space-y-5 pb-8">
      <header>
        <h1 className="text-2xl leading-9 text-ink-900">Dashboard Overview</h1>
        <p className="max-w-2xl text-sm text-primary-700">
          Live load KPIs, critical incidents first, quick actions, recent
          activity.
        </p>
        {isError ? (
          <p className="mt-2 text-sm text-danger">
            Unable to load live load metrics right now.
          </p>
        ) : null}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.28,
              ease: "easeOut",
              delay: index * 0.04,
            }}
          >
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>

      <DashboardPanels />
    </section>
  );
}
