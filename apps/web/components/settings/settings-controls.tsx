"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { Switch } from "@repo/ui/components/switch";

import { notifications, preferenceItems } from "./settings-data";

const toneClasses = {
  danger: "bg-red-50 text-red-500",
  blue: "bg-blue-50 text-blue-600",
  warning: "bg-amber-50 text-amber-500",
  teal: "bg-teal-50 text-teal-600",
  violet: "bg-violet-50 text-violet-600",
} as const;

export const NotificationCenter = (): React.JSX.Element => {
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("All types");
  const [readIds, setReadIds] = React.useState<Set<number>>(new Set());
  const filtered = notifications.filter((item) => {
    const matchesType = type === "All types" || item.type === type;
    const matchesQuery = `${item.title} ${item.detail}`
      .toLowerCase()
      .includes(query.toLowerCase());

    return matchesType && matchesQuery;
  });

  return (
    <section className="min-w-0 p-5">
      <h2 className="text-base font-bold text-ink-900">Notification center</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(180px,1fr)_auto_auto]">
        <label className="flex h-10 items-center gap-2 border border-border px-3 text-primary-700 focus-within:border-blue-500">
          <Search className="size-4 shrink-0" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notifications"
            value={query}
          />
        </label>
        <Button
          className="h-10 rounded-none"
          onClick={() => setReadIds(new Set(notifications.map(({ id }) => id)))}
          variant="outline"
        >
          Mark all as read
        </Button>
        <label className="relative">
          <select
            className="h-10 w-full appearance-none border border-border bg-white pr-9 pl-3 text-sm font-medium text-primary-700 outline-none"
            onChange={(event) => setType(event.target.value)}
            value={type}
          >
            <option>All types</option>
            {[
              ...new Set(notifications.map(({ type: itemType }) => itemType)),
            ].map((itemType) => (
              <option key={itemType}>{itemType}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-3 right-3 size-4" />
        </label>
      </div>

      <div className="mt-3">
        {filtered.map((item) => {
          const Icon = item.icon;
          const isUnread = item.unread && !readIds.has(item.id);

          return (
            <button
              className="grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 py-3 text-left transition hover:bg-surface-50"
              key={item.id}
              onClick={() =>
                setReadIds((current) => new Set(current).add(item.id))
              }
              type="button"
            >
              <span
                className={`flex size-8 items-center justify-center rounded-md ${toneClasses[item.tone]}`}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-sm text-ink-900">
                  {item.title}
                </strong>
                <span className="block truncate text-xs text-primary-700">
                  {item.detail}
                </span>
              </span>
              <span className="flex items-center gap-3 pl-2 text-xs text-primary-700">
                {item.time}
                {isUnread ? (
                  <span className="size-2 rounded-full bg-blue-600" />
                ) : (
                  <ChevronRight className="size-4 text-slate-400" />
                )}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-ink-500">
            No notifications match your search.
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-primary-700">
        <span>Showing {filtered.length} of 128 notifications</span>
        <div className="flex gap-1">
          {["‹", "1", "2", "3", "…", "16", "›"].map((page) => (
            <button
              className={`grid size-8 place-items-center border border-border ${
                page === "1" ? "bg-blue-50 font-bold text-blue-600" : "bg-white"
              }`}
              key={page}
              type="button"
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export const NotificationPreferences = (): React.JSX.Element => {
  const [preferences, setPreferences] = React.useState<Record<string, boolean>>(
    Object.fromEntries(preferenceItems.map((item) => [item.id, item.enabled])),
  );

  return (
    <section className="border-t border-border p-5 lg:border-t-0 lg:border-l">
      <h2 className="text-base font-bold text-ink-900">
        Notification preferences
      </h2>
      <div className="mt-4 space-y-1">
        {preferenceItems.map((item) => {
          const Icon = item.icon;
          const checked = preferences[item.id] ?? false;

          return (
            <div className="flex items-center gap-3 py-2" key={item.id}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-primary-700">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm text-ink-900">
                  {item.label}
                </strong>
                <span className="block truncate text-xs text-primary-700">
                  {item.description}
                </span>
              </span>
              <Switch
                aria-label={`Toggle ${item.label} notifications`}
                checked={checked}
                onCheckedChange={() =>
                  setPreferences((current) => ({
                    ...current,
                    [item.id]: !checked,
                  }))
                }
              />
            </div>
          );
        })}
      </div>
      <div className="mt-7 flex justify-end">
        <Button className="rounded-none" variant="outline">
          Manage channels
        </Button>
      </div>
    </section>
  );
};
