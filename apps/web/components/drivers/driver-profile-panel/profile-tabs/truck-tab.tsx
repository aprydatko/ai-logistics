import { ChevronRight, Truck } from "lucide-react";
import Image from "next/image";

import type { DriverDetails } from "@/lib/drivers/drivers-query";
import { StatusBadge } from "@repo/ui/components/status-badge";

import { EmptyTab, PanelSection } from "../panel-section";
import { formatDate } from "../profile-formatters";

export const TruckTab = ({
  details,
}: {
  details: DriverDetails;
}): React.JSX.Element => {
  if (!details.currentVehicle) return <EmptyTab label="Truck" />;

  const vehicle = details.currentVehicle;
  const vehicleName = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");
  const statusTone =
    vehicle.status === "active"
      ? "success"
      : vehicle.status === "maintenance"
        ? "warning"
        : "neutral";

  return (
    <PanelSection title="Truck info">
      <div className="grid grid-cols-[6.75rem_minmax(0,1fr)_2rem] items-center gap-x-4 px-4">
        <div className="relative row-span-2 flex h-[5.5rem] w-[6.75rem] items-center justify-center overflow-hidden rounded-md bg-surface-100">
          {vehicle.imageUrl ? (
            <Image
              alt={`Truck ${vehicle.unitNumber}`}
              className="object-cover"
              fill
              sizes="108px"
              src={vehicle.imageUrl}
              unoptimized
            />
          ) : (
            <Truck className="size-10 text-primary-700/55" />
          )}
        </div>

        <div className="min-w-0 self-start">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h3 className="truncate text-lg font-bold text-ink-900">
              Truck {vehicle.unitNumber}
            </h3>
            <StatusBadge size="sm" tone={statusTone}>
              {vehicle.status.replaceAll("_", " ")}
            </StatusBadge>
          </div>
          {vehicleName ? (
            <p className="mt-0.5 truncate text-base text-primary-700">
              {vehicleName}
            </p>
          ) : null}
        </div>

        <ChevronRight className="row-span-2 size-6 self-center text-ink-900" />

        <dl className="mt-3 grid grid-cols-3 gap-x-4 self-end max-sm:col-span-2 max-sm:grid-cols-2 max-sm:gap-y-3">
          <div>
            <dt className="text-sm text-primary-700">Plate</dt>
            <dd className="mt-0.5 truncate font-semibold text-ink-900">
              {vehicle.licensePlate || "Not specified"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-primary-700">Odometer</dt>
            <dd className="mt-0.5 truncate font-semibold text-ink-900">
              {vehicle.odometerMiles !== null
                ? `${vehicle.odometerMiles.toLocaleString()} mi`
                : "Not specified"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-primary-700">Last service</dt>
            <dd className="mt-0.5 truncate font-semibold text-ink-900">
              {vehicle.lastServiceAt
                ? formatDate(vehicle.lastServiceAt)
                : "Not specified"}
            </dd>
          </div>
        </dl>
      </div>
    </PanelSection>
  );
};
