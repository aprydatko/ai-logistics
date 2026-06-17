"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  NotificationCategory,
  NotificationPreference,
} from "@repo/shared";
import { Bell, Bot, FileText, Settings, Truck, UserRound } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { Switch } from "@repo/ui/components/switch";
import { toast } from "@repo/ui/components/toaster";

import {
  notificationPreferencesQueryOptions,
  updateNotificationPreferences,
} from "@/lib/notifications/notifications-query";
import { useNotificationsStore } from "@/stores/notifications-store";

const categoryMeta: Record<
  NotificationCategory,
  {
    description: string;
    icon: typeof Truck;
    label: string;
  }
> = {
  ai: {
    description: "AI suggestions, reports and insights",
    icon: Bot,
    label: "AI & Reports",
  },
  documents: {
    description: "Document uploads and extraction results",
    icon: FileText,
    label: "Documents",
  },
  drivers: {
    description: "Driver assignments, availability and updates",
    icon: UserRound,
    label: "Drivers",
  },
  incidents: {
    description: "Incident alerts and status changes",
    icon: Bell,
    label: "Incidents",
  },
  loads: {
    description: "Updates on load status, assignments and delays",
    icon: Truck,
    label: "Loads",
  },
  system: {
    description: "System updates and maintenance",
    icon: Settings,
    label: "System",
  },
};

const clonePreferences = (
  preferences: NotificationPreference,
): NotificationPreference => ({
  ...preferences,
  ai: { ...preferences.ai },
  documents: { ...preferences.documents },
  drivers: { ...preferences.drivers },
  incidents: { ...preferences.incidents },
  loads: { ...preferences.loads },
  system: { ...preferences.system },
});

export const NotificationPreferences = (): React.JSX.Element => {
  const queryClient = useQueryClient();
  const { data } = useQuery(notificationPreferencesQueryOptions());
  const snapshot = useNotificationsStore((state) => state.preferencesSnapshot);
  const setSnapshot = useNotificationsStore(
    (state) => state.setPreferencesSnapshot,
  );
  const preferences = snapshot ?? data;

  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: async (updated) => {
      setSnapshot(updated);
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "preferences"],
      });
      toast.success("Notification preferences saved");
    },
    onError: (error: Error) =>
      toast.error("Unable to save notification preferences", {
        description: error.message,
      }),
  });

  if (!preferences) {
    return (
      <section className="border-t border-border p-5 lg:border-l lg:border-t-0">
        <h2 className="text-base font-bold text-ink-900">
          Notification preferences
        </h2>
        <p className="mt-4 text-sm text-primary-700">
          Loading notification preferences...
        </p>
      </section>
    );
  }

  const draft = clonePreferences(preferences);

  const updateCategory = (
    category: NotificationCategory,
    field: "emailEnabled" | "inAppEnabled",
  ): void => {
    const next = clonePreferences(preferences);
    next[category][field] = !next[category][field];
    setSnapshot(next);
  };

  return (
    <section className="border-t border-border p-5 lg:border-l lg:border-t-0">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-ink-900">
          Notification preferences
        </h2>
        <select
          className="border border-border bg-white px-3 py-2 text-xs font-medium text-primary-700"
          onChange={(event) => {
            const next = clonePreferences(preferences);
            next.emailFrequency = event.target
              .value as NotificationPreference["emailFrequency"];
            setSnapshot(next);
          }}
          value={preferences.emailFrequency}
        >
          <option value="off">Email off</option>
          <option value="instant">Email instantly</option>
          <option value="daily">Daily digest</option>
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {(
          [
            "loads",
            "drivers",
            "incidents",
            "documents",
            "ai",
            "system",
          ] as const
        ).map((category) => {
          const meta = categoryMeta[category];
          const Icon = meta.icon;
          const current = preferences[category];

          return (
            <div className="flex items-center gap-3 py-2" key={category}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-primary-700">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm text-ink-900">
                  {meta.label}
                </strong>
                <span className="block truncate text-xs text-primary-700">
                  {meta.description}
                </span>
              </span>
              <div className="flex items-center gap-3 text-xs text-primary-700">
                <label className="flex items-center gap-2">
                  In-app
                  <Switch
                    aria-label={`Toggle ${meta.label} in-app notifications`}
                    checked={current.inAppEnabled}
                    onCheckedChange={() =>
                      updateCategory(category, "inAppEnabled")
                    }
                  />
                </label>
                <label className="flex items-center gap-2">
                  Email
                  <Switch
                    aria-label={`Toggle ${meta.label} email notifications`}
                    checked={current.emailEnabled}
                    onCheckedChange={() =>
                      updateCategory(category, "emailEnabled")
                    }
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-7 flex justify-end">
        <Button
          className="rounded-none"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate({
              ai: draft.ai,
              documents: draft.documents,
              drivers: draft.drivers,
              emailFrequency: draft.emailFrequency,
              incidents: draft.incidents,
              loads: draft.loads,
              system: draft.system,
            })
          }
          variant="outline"
        >
          Save preferences
        </Button>
      </div>
    </section>
  );
};
