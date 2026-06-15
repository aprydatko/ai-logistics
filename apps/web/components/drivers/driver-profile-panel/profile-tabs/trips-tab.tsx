import { Route } from "lucide-react";

import type { DriverDetails } from "@/lib/drivers/drivers-query";
import { StatusBadge } from "@repo/ui/components/status-badge";

import { EmptyTab, PanelSection } from "../panel-section";

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
          <div className="flex items-center gap-3 py-3" key={trip.id}>
            <Route className="size-5 text-primary-700" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{trip.referenceNumber}</p>
              <p className="truncate text-xs text-primary-700">
                {trip.pickupAddress} → {trip.deliveryAddress}
              </p>
            </div>
            <StatusBadge
              tone={trip.status === "delivered" ? "success" : "warning"}
            >
              {trip.status.replaceAll("_", " ")}
            </StatusBadge>
          </div>
        ))}
      </div>
    </PanelSection>
  );
};
