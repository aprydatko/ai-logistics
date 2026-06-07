"use client";

import {
  ChevronRight,
  ClipboardCheck,
  Edit3,
  FileBadge,
  FileText,
  Mail,
  Route,
  Star,
  Truck,
} from "lucide-react";
import type * as React from "react";

import { DriverAvatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { SidePanel } from "@repo/ui/components/side-panel";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { cn } from "@repo/ui/lib/utils";

import { driverStatusTone } from "./driver-styles";
import { DriverRow } from "./types";

type DriverProfilePanelProps = {
  driver: DriverRow | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (driver: DriverRow) => void;
};

const profileTabs = ["Profile", "Truck", "Info", "Docs", "Trips", "Activity"];

const documents = [
  { icon: FileBadge, name: "Driver License", expires: "Aug 12, 2026" },
  { icon: ClipboardCheck, name: "Medical Card", expires: "Oct 1, 2025" },
  { icon: FileText, name: "Insurance", expires: "Dec 31, 2025" },
];

const trips = [
  {
    route: "Chicago, IL -> Detroit, MI",
    status: "On time",
    time: "May 28, 14:30",
    title: "Load #LD-78291",
    tone: "success",
  },
  {
    route: "Dallas, TX -> Houston, TX",
    status: "Delayed",
    time: "May 27, 09:45",
    title: "Load #LD-10456",
    tone: "warning",
  },
  {
    route: "Atlanta, GA -> Miami, FL",
    status: "On time",
    time: "May 25, 16:20",
    title: "Load #LD-2156",
    tone: "success",
  },
] as const;

function PanelSection({
  action,
  children,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  title: string;
}): React.JSX.Element {
  return (
    <section className="border rounded-md border-border/70 mt-4 ml-5 mr-3 pb-4 last:border-b-0">
      <div className="mb-3 px-4 py-2 flex items-center justify-between gap-3 border-b">
        <h3 className="text-base font-bold text-ink-900">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DriverProfilePanel({
  driver,
  isOpen,
  onClose,
  onEdit,
}: DriverProfilePanelProps): React.JSX.Element | null {
  if (!driver) {
    return null;
  }

  const email = `${driver.name.toLowerCase().replaceAll(" ", ".")}@ailogistics.com`;

  return (
    <SidePanel
      isOpen={isOpen}
      mode="inline"
      onClose={onClose}
      title="Driver profile"
    >
      <div className=" px-5 pt-5">
        <div className="flex items-start gap-9 px-2">
          <DriverAvatar
            className="ring-2 ring-surface-100"
            imageUrl={driver.avatarUrl}
            name={driver.name}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold leading-none text-ink-900">
                  {driver.name}
                </h3>
                <p className="mt-3 text-base font-medium text-primary-700">
                  ID: {driver.id}
                </p>
              </div>
              <StatusBadge size="lg" tone={driverStatusTone[driver.status]}>
                {driver.status}
              </StatusBadge>
            </div>
            <p className="mt-2 text-base font-medium text-primary-700">
              +1 (312) 555-0198
            </p>
            <div className=" flex items-center gap-2 text-base font-medium text-info">
              <span className="truncate">{email}</span>
              <Mail className="size-4 shrink-0" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-5 overflow-x-auto border-b border-border">
          {profileTabs.map((tab) => (
            <button
              className={cn(
                "shrink-0 border-b-3 px-3 pb-3 text-base font-semibold transition-colors",
                tab === "Profile"
                  ? "border-primary-700 text-primary-700"
                  : "border-transparent text-primary-700/75 hover:text-primary-700",
              )}
              key={tab}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <PanelSection
        action={
          <Button
            onClick={() => {
              onEdit(driver);
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <Edit3 className="size-4" />
            Edit
          </Button>
        }
        title="Profile summary"
      >
        <div className="grid grid-cols-3 gap-2 px-4">
          <div className="rounded-md border border-border p-3">
            <p className="text-sm font-normal text-primary-700">Status</p>
            <StatusBadge
              className="mt-3"
              tone={driverStatusTone[driver.status]}
            >
              {driver.status}
            </StatusBadge>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-sm font-base text-primary-700">License</p>
            <p className="mt-2 text-base font-bold text-ink-900">
              {driver.source?.licenseType ?? "Not provided"}
            </p>
            <p className="mt-1 text-sm text-primary-700">
              Expires: {driver.source?.licenseExpirationDate ?? "Not provided"}
            </p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-sm font-normal text-primary-700">Rating</p>
            <div className="mt-2 flex items-center gap-1 text-base font-semibold text-ink-900">
              <Star className="size-5 fill-warning text-warning" />
              4.8 / 5
            </div>
            <p className="mt-1 text-sm text-primary-700">128 trips</p>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Truck info">
        <div className="flex items-center gap-8 px-4">
          <div className="flex size-25 shrink-0 items-center justify-center rounded-md bg-surface-100 text-primary-700">
            <Truck className="size-10" />
          </div>
          <div className="min-w-0 flex-1 ">
            <div className="relative flex items-center gap-6">
              <h3 className="font-bold text-ink-900">{driver.truck}</h3>
              <StatusBadge size="sm" tone="success">
                Active
              </StatusBadge>
              <ChevronRight className="absolute top-4 right-0 size-5 text-primary-700" />
            </div>
            <p className="mt-2 text-xs text-primary-700">Volvo VNL 860</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-primary-700">Plate</p>
                <p className="mt-1 font-semibold text-ink-900">IL 8282 AB</p>
              </div>
              <div>
                <p className="text-primary-700">Odometer</p>
                <p className="mt-1 font-semibold text-ink-900">243,420 mi</p>
              </div>
              <div>
                <p className="text-primary-700">Last service</p>
                <p className="mt-1 font-semibold text-ink-900">May 20, 2025</p>
              </div>
            </div>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Documents">
        <div className="divide-y divide-border/70 px-4">
          {documents.map(({ icon: Icon, name, expires }) => (
            <div className="flex items-center gap-3 py-3" key={name}>
              <span className="flex size-10 items-center justify-center rounded-md bg-surface-100 text-primary-700">
                <Icon className="size-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink-900">{name}</p>
                <p className="text-xs text-primary-700">Expires {expires}</p>
              </div>
              <StatusBadge tone="success">Valid</StatusBadge>
            </div>
          ))}
        </div>
        <Button className="w-full text-info" type="button" variant="link">
          View all documents
        </Button>
      </PanelSection>

      <PanelSection title="Trip history (latest)">
        <div className="divide-y divide-border/70 px-4">
          {trips.map((trip) => (
            <div className="flex items-center gap-3 py-3" key={trip.title}>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  trip.tone === "warning"
                    ? "bg-warning-background text-warning"
                    : "bg-accent text-teal-600",
                )}
              >
                <Route className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">
                  {trip.title}
                </p>
                <p className="truncate text-xs text-primary-700">
                  {trip.route}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary-700">{trip.time}</p>
                <StatusBadge
                  className="mt-2"
                  tone={trip.tone === "warning" ? "warning" : "success"}
                >
                  {trip.status}
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full text-info" type="button" variant="link">
          View all trips
        </Button>
      </PanelSection>
    </SidePanel>
  );
}
