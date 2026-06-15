import { Activity, Route } from "lucide-react";

import type { DriverDetails } from "@/lib/drivers/drivers-query";

export const HistoryTab = ({
  details,
  type,
}: {
  details?: DriverDetails;
  type: "activity" | "trips";
}): React.JSX.Element => {
  const items = type === "trips" ? details?.tripsHistory : details?.activity;

  if (!items?.length) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-primary-700">
        No {type} recorded yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-white px-4">
      {type === "trips"
        ? details?.tripsHistory.map((trip) => (
            <div className="flex gap-3 py-4" key={trip.id}>
              <Route className="mt-0.5 size-5 text-primary-700" />
              <div>
                <p className="font-semibold">{trip.referenceNumber}</p>
                <p className="text-sm text-primary-700">
                  {trip.pickupAddress} → {trip.deliveryAddress}
                </p>
              </div>
            </div>
          ))
        : details?.activity.map((item) => (
            <div className="flex gap-3 py-4" key={item.id}>
              <Activity className="mt-0.5 size-5 text-primary-700" />
              <div>
                <p className="font-semibold">{item.description}</p>
                <p className="text-xs text-primary-700">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))
      }
    </div>
  );
};
