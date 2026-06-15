"use client";

import * as React from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";

import { Switch } from "@repo/ui/components/switch";

const DetailRow = ({
  label,
  value,
  action = false,
}: {
  label: string;
  value: React.ReactNode;
  action?: boolean;
}): React.JSX.Element => (
  <div className="grid grid-cols-[minmax(90px,1fr)_minmax(0,1.5fr)_auto] items-center gap-3 text-xs">
    <dt className="text-primary-700">{label}</dt>
    <dd className="truncate font-medium text-primary-700">{value}</dd>
    {action ? <ChevronRight className="size-4 text-primary-700" /> : <span />}
  </div>
);

const SummaryCard = ({
  children,
  className = "",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
}): React.JSX.Element => (
  <section className={`border border-border bg-white p-4 ${className}`}>
    <h2 className="mb-4 text-base font-bold text-ink-900">{title}</h2>
    {children}
  </section>
);

export const SettingsSummary = (): React.JSX.Element => {
  const [showRead, setShowRead] = React.useState(true);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <SummaryCard className="xl:col-span-2" title="Unread / read state">
        <dl className="space-y-3">
          <DetailRow
            label="Unread count"
            value={
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                3
              </span>
            }
          />
          <DetailRow
            label="Email digest"
            value={
              <select className="border border-border bg-white px-3 py-1.5">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Off</option>
              </select>
            }
          />
          <DetailRow
            label="Show read notifications"
            value={
              <Switch
                aria-label="Show read notifications"
                checked={showRead}
                onCheckedChange={setShowRead}
              />
            }
          />
        </dl>
      </SummaryCard>

      <SummaryCard className="xl:col-span-2" title="Profile & security">
        <dl className="space-y-3">
          <DetailRow action label="Name" value="Alex Dispatcher" />
          <DetailRow
            action
            label="Email"
            value="alex.dispatcher@ailogistics.com"
          />
          <DetailRow action label="Password" value="••••••••" />
          <DetailRow
            action
            label="2FA"
            value={
              <span className="rounded bg-teal-50 px-2 py-1 text-teal-700">
                Enabled
              </span>
            }
          />
        </dl>
      </SummaryCard>

      <SummaryCard className="xl:col-span-2" title="Role / admin settings">
        <dl className="space-y-3">
          <DetailRow action label="Role" value="Dispatcher" />
          <DetailRow
            action
            label="Permissions"
            value="View and manage operations"
          />
          <DetailRow action label="Team" value="Operations" />
        </dl>
      </SummaryCard>

      <SummaryCard className="xl:col-span-3" title="Environment">
        <dl className="space-y-3">
          <DetailRow
            label="Active environment"
            value={
              <span className="rounded bg-teal-50 px-2 py-1 text-teal-700">
                Production
              </span>
            }
          />
          <DetailRow label="Region" value="US West (Oregon)" />
          <DetailRow label="Version" value="v2.4.1" />
        </dl>
      </SummaryCard>

      <SummaryCard className="xl:col-span-3" title="System notifications">
        <dl className="space-y-3">
          <DetailRow label="Maintenance mode" value="Off" />
          <DetailRow
            label="Scheduled maintenance"
            value="May 31, 02:00 – 04:00"
          />
          <DetailRow
            label="Status page"
            value={
              <span className="inline-flex items-center gap-1">
                status.ailogistics.com <ArrowUpRight className="size-3.5" />
              </span>
            }
          />
        </dl>
      </SummaryCard>
    </div>
  );
};
