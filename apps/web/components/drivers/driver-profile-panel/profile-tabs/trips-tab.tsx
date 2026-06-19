import { Route } from "lucide-react";

import type { DriverDetails } from "@/lib/drivers/drivers-query";
import { StatusBadge } from "@repo/ui/components/status-badge";

import { EmptyTab, PanelSection } from "../panel-section";
import { formatTimestamp } from "../profile-formatters";

const tripStatusTone: Record<
  DriverDetails["tripsHistory"][number]["status"],
  "success" | "warning" | "danger"
> = {
  pending: "warning",
  assigned: "warning",
  in_transit: "warning",
  delivered: "success",
  cancelled: "danger",
};

export const TripsTab = ({
  details,
}: {
  details: DriverDetails;
}): React.JSX.Element => {
  if (!details.tripsHistory.length) return <EmptyTab label="Trips" />;

  const activeTrips = details.tripsHistory.filter(
    (trip) => trip.status === "assigned" || trip.status === "in_transit",
  );
  const completedTrips = details.tripsHistory.filter(
    (trip) => trip.status === "delivered",
  );
  const cancelledTrips = details.tripsHistory.filter(
    (trip) => trip.status === "cancelled",
  );
  const tripGroups = [
    {
      title: "Active runs",
      trips: activeTrips,
    },
    {
      title: "Recent history",
      trips: details.tripsHistory.filter(
        (trip) => trip.status !== "assigned" && trip.status !== "in_transit",
      ),
    },
  ].filter((group) => group.trips.length > 0);

  return (
    <>
      <PanelSection title="Trip summary">
        <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4">
          <TripMetric
            label="Total trips"
            value={`${details.tripsHistory.length}`}
          />
          <TripMetric label="Active now" value={`${activeTrips.length}`} />
          <TripMetric label="Delivered" value={`${completedTrips.length}`} />
          <TripMetric label="Cancelled" value={`${cancelledTrips.length}`} />
        </div>
      </PanelSection>

      <PanelSection title="Trip history">
        <div className="space-y-5 px-4">
          {tripGroups.map((group) => (
            <section key={group.title}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-ink-900">
                  {group.title}
                </h4>
                <span className="text-xs text-primary-700">
                  {group.trips.length} trip{group.trips.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="divide-y divide-border/70 rounded-md border border-border/70">
                {group.trips.map((trip) => (
                  <TripHistoryItem key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </PanelSection>
    </>
  );
};

const TripMetric = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element => (
  <div className="rounded-md border border-border bg-white p-3">
    <p className="text-sm text-primary-700">{label}</p>
    <p className="mt-2 text-lg font-bold text-ink-900">{value}</p>
  </div>
);

const TripHistoryItem = ({
  trip,
}: {
  trip: DriverDetails["tripsHistory"][number];
}): React.JSX.Element => (
  <div className="flex items-start gap-3 p-4">
    <Route className="mt-0.5 size-5 shrink-0 text-primary-700" />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink-900">{trip.referenceNumber}</p>
          <p className="mt-1 text-xs text-primary-700">
            {trip.pickupAddress} to {trip.deliveryAddress}
          </p>
        </div>
        <StatusBadge tone={tripStatusTone[trip.status]}>
          {trip.status.replaceAll("_", " ")}
        </StatusBadge>
      </div>
      <p className="mt-2 text-xs text-primary-700">
        Pickup {formatTimestamp(trip.pickupDate)} | Delivery{" "}
        {formatTimestamp(trip.deliveryDate)}
      </p>
      <p className="mt-1 text-xs text-primary-700">
        {trip.miles} mi | {trip.weight.toLocaleString()} lbs | $
        {trip.price.toLocaleString()} | {trip.broker.companyName}
      </p>
      {trip.timeline.length > 0 ? (
        <p className="mt-1 text-xs text-primary-700">
          Timeline events: {trip.timeline.length}
        </p>
      ) : null}
    </div>
  </div>
);
