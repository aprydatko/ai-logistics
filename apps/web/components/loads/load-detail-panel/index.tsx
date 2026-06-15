"use client";

import { ArrowRight, Pencil, UserRoundPlus } from "lucide-react";
import { useState } from "react";

import type { LoadApiItem } from "@/lib/loads/loads-query";
import { Button } from "@repo/ui/components/button";
import { RouteMap } from "@repo/ui/components/route-map";
import { SidePanel } from "@repo/ui/components/side-panel";
import { StatusBadge } from "@repo/ui/components/status-badge";

import { loadStatusTone } from "../load-styles";
import { OverviewCard } from "./overview-card";

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export const LoadDetailPanel = ({
  load,
  onAssign,
  onClose,
  onEdit,
}: {
  load: LoadApiItem | null;
  onAssign: (load: LoadApiItem) => void;
  onClose: () => void;
  onEdit: (load: LoadApiItem) => void;
}): React.JSX.Element | null => {
  const [tab, setTab] = useState<"overview" | "route" | "timeline">("overview");
  if (!load) return null;
  const route = load.routePoints.map(
    (point) => [point.longitude, point.latitude] as [number, number],
  );

  return (
    <SidePanel
      className="xl:w-[34rem]"
      isOpen
      mode="inline"
      onClose={onClose}
      title="Load detail"
    >
      <div className="space-y-5 p-5">
        <header>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{load.referenceNumber}</h3>
            <StatusBadge size="sm" tone={loadStatusTone[load.status]}>
              {load.status.replace("_", " ")}
            </StatusBadge>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-primary-700">
            <span>{load.pickupAddress}</span>
            <ArrowRight className="size-4 shrink-0" />
            <span>{load.deliveryAddress}</span>
          </p>
        </header>
        <div className="flex gap-5 border-b border-border">
          {(["overview", "route", "timeline"] as const).map((item) => (
            <button
              className={`border-b-2 pb-2 text-xs font-semibold capitalize ${
                tab === item
                  ? "border-primary-700"
                  : "border-transparent text-primary-700"
              }`}
              key={item}
              onClick={() => setTab(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <OverviewCard label="Driver">
                {load.driver
                  ? `${load.driver.firstName} ${load.driver.lastName}`
                  : "Unassigned"}
              </OverviewCard>
              <OverviewCard label="Truck">
                {load.driver?.truckNumber ?? "Not assigned"}
              </OverviewCard>
              <OverviewCard label="ETA">
                {formatDate(load.deliveryDate)}
              </OverviewCard>
              <OverviewCard label="Distance">
                {load.miles.toLocaleString()} mi
              </OverviewCard>
              <OverviewCard label="Weight">
                {load.weight.toLocaleString()} lb
              </OverviewCard>
              <OverviewCard label="Price">
                ${load.price.toLocaleString()}
              </OverviewCard>
            </div>

            <section className="rounded-md border border-border p-4">
              <h4 className="text-sm font-bold">Schedule</h4>
              <dl className="mt-4 grid grid-cols-[6rem_1fr] gap-3 text-xs">
                <dt className="text-primary-700">Pickup</dt>
                <dd>{formatDate(load.pickupDate)}</dd>
                <dt className="text-primary-700">Delivery</dt>
                <dd>{formatDate(load.deliveryDate)}</dd>
              </dl>
            </section>

            <section className="rounded-md border border-border p-4">
              <h4 className="text-sm font-bold">Broker</h4>
              <dl className="mt-4 grid grid-cols-[6rem_1fr] gap-3 text-xs">
                <dt className="text-primary-700">Company</dt>
                <dd>{load.broker.companyName}</dd>
                <dt className="text-primary-700">Broker ID</dt>
                <dd>{load.broker.id}</dd>
                <dt className="text-primary-700">Phone</dt>
                <dd>{load.broker.phone}</dd>
              </dl>
            </section>

            {load.notes ? (
              <section className="rounded-md border border-border p-4">
                <h4 className="text-sm font-bold">Notes</h4>
                <p className="mt-3 whitespace-pre-wrap text-sm text-primary-700">
                  {load.notes}
                </p>
              </section>
            ) : null}
          </>
        ) : null}

        {tab === "route" ? (
          load.routePoints.length >= 2 ? (
            <div className="space-y-4">
              <RouteMap
                center={route[0]!}
                className="h-72 min-h-72 rounded-lg"
                markers={load.routePoints.map((point, index) => ({
                  coordinates: route[index]!,
                  id: String(index),
                  label: point.label,
                }))}
                route={route}
                zoom={5}
              />
              {load.routePoints.map((point, index) => (
                <p className="text-sm" key={`${point.label}-${index}`}>
                  <span className="font-semibold">
                    {index + 1}. {point.label}
                  </span>
                  <span className="ml-2 text-primary-700">
                    {point.latitude}, {point.longitude}
                  </span>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-primary-700">
              No route points available.
            </p>
          )
        ) : null}

        {tab === "timeline" ? (
          <div className="space-y-3">
            {[...load.timeline]
              .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
              .map((event, index) => (
                <div
                  className="border-l-2 border-primary-700 pl-4"
                  key={`${event.dateTime}-${index}`}
                >
                  <p className="text-xs text-primary-700">
                    {formatDate(event.dateTime)}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{event.title}</p>
                  {event.description ? (
                    <p className="mt-1 text-sm text-primary-700">
                      {event.description}
                    </p>
                  ) : null}
                </div>
              ))}
            {load.timeline.length === 0 ? (
              <p className="text-sm text-primary-700">
                No timeline events available.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-3">
          <Button
            onClick={() => onAssign(load)}
            type="button"
            variant="outline"
          >
            <UserRoundPlus className="size-4" /> Assign driver
          </Button>
          <Button onClick={() => onEdit(load)} type="button" variant="outline">
            <Pencil className="size-4" /> Edit load
          </Button>
        </div>
      </div>
    </SidePanel>
  );
};
