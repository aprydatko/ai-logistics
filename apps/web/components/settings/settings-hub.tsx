"use client";

import * as React from "react";

import {
  NotificationCenter,
} from "./notification-center";
import { NotificationPreferences } from "./notification-preferences";
import { SettingsSummary } from "./settings-summary";

const tabs = [
  "Notifications",
  "Profile & Security",
  "Preferences",
  "Admin Settings",
  "Environment",
  "Audit Logs",
] as const;

export const SettingsHub = (): React.JSX.Element => {
  const [activeTab, setActiveTab] =
    React.useState<(typeof tabs)[number]>("Notifications");

  return (
    <main className="mx-auto w-full max-w-[1500px] pb-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Settings
        </h1>
        <p className="mt-2 text-sm text-primary-700">
          Manage your preferences, notifications, profile and system settings.
        </p>
        <nav
          aria-label="Settings sections"
          className="mt-5 flex gap-7 overflow-x-auto border-b border-border"
        >
          {tabs.map((tab) => (
            <button
              className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold transition ${
                activeTab === tab
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-primary-700 hover:text-ink-900"
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === "Notifications" ? (
        <div className="mt-4 space-y-3">
          <div className="grid border border-border bg-white shadow-sm lg:grid-cols-[1.02fr_1fr]">
            <NotificationCenter />
            <NotificationPreferences />
          </div>
          <SettingsSummary />
        </div>
      ) : (
        <section className="mt-4 flex min-h-[520px] items-center justify-center border border-border bg-white text-center shadow-sm">
          <div>
            <p className="text-lg font-bold text-ink-900">{activeTab}</p>
            <p className="mt-2 text-sm text-primary-700">
              This settings section is ready for configuration.
            </p>
          </div>
        </section>
      )}
    </main>
  );
};
