"use client";

import {
  Activity,
  BrainCircuit,
  FileText,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import type { LoadFormValues } from "@/lib/loads/load-form-schema";
import { RouteTab } from "./route-tab";
import { TimelineTab } from "./timeline-tab";

export type LoadFormTab =
  | "overview"
  | "timeline"
  | "route"
  | "documents"
  | "activity"
  | "ai-insights";

interface SecondaryTabProps {
  form: UseFormReturn<LoadFormValues>;
  tab: Exclude<LoadFormTab, "overview">;
}

const EmptyState = ({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: typeof FileText;
  title: string;
}): React.JSX.Element => (
  <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border bg-surface-100/40 p-10 text-center">
    <div>
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-primary-700 shadow-sm">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 text-sm font-bold text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-primary-700">
        {description}
      </p>
    </div>
  </div>
);

export const SecondaryTab = ({
  form,
  tab,
}: SecondaryTabProps): React.JSX.Element => {
  const values = form.getValues();

  if (tab === "route") {
    return <RouteTab form={form} />;
  }

  if (tab === "timeline") {
    return <TimelineTab form={form} />;
  }

  if (tab === "ai-insights") {
    return (
      <section>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-info-background text-info">
            <BrainCircuit className="size-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-ink-900">AI insights</h3>
            <p className="text-xs text-primary-700">
              Basic operational checks from the current form values.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["Route readiness", values.origin && values.destination ? "Ready" : "Needs locations"],
            ["Assignment", values.driverName ? "Driver assigned" : "Driver required"],
            ["Priority signal", `${values.priority} priority load`],
            ["ETA confidence", values.eta ? "ETA provided" : "ETA missing"],
          ].map(([label, value]) => (
            <div className="rounded-lg border border-border p-4" key={label}>
              <p className="text-xs text-primary-700">{label}</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{value}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (tab === "documents") {
    return (
      <EmptyState
        description="Bills of lading, proof of delivery, invoices, and other load files will appear here when document persistence is connected."
        icon={FileText}
        title="No load documents"
      />
    );
  }

  return (
    <EmptyState
      description="Status changes, assignments, document updates, and user actions will be recorded here."
      icon={Activity}
      title="No activity yet"
    />
  );
};
