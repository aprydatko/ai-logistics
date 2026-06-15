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

  return (
    <PanelSection title="Trip history">
      <div className="divide-y divide-border/70 px-4">
        {details.tripsHistory.map((trip) => (
          <div className="flex items-start gap-3 py-3" key={trip.id}>
            <Route className="mt-0.5 size-5 shrink-0 text-primary-700" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{trip.referenceNumber}</p>
              <p className="mt-1 truncate text-xs text-primary-700">
                {trip.pickupAddress} → {trip.deliveryAddress}
              </p>
              <p className="mt-1 text-xs text-primary-700">
                Pickup {formatTimestamp(trip.pickupDate)} · Delivery{" "}
                {formatTimestamp(trip.deliveryDate)}
              </p>
              <p className="mt-1 text-xs text-primary-700">
                {trip.miles} mi · ${trip.price.toLocaleString()} ·{" "}
                {trip.broker.companyName}
              </p>
            </div>
            <StatusBadge tone={tripStatusTone[trip.status]}>
              {trip.status.replaceAll("_", " ")}
            </StatusBadge>
          </div>
        ))}
      </div>
    </PanelSection>
  );
};
