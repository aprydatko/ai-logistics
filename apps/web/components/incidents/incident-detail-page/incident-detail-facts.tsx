import Image from "next/image";
import { AlertTriangle, MapPin, Truck, UserRound } from "lucide-react";

import { DriverAvatar } from "@repo/ui/components/avatar";

import { incidentTypeLabels, type Incident } from "../types";
import { formatDateTime, getDriverName } from "./incident-detail-view-model";

export const IncidentDetailFacts = ({
  incident,
}: {
  incident: Incident;
}): React.JSX.Element => {
  const driverName = getDriverName(incident);

  return (
    <div className="space-y-6">
      <dl className="space-y-4">
        <FactRow
          icon={<AlertTriangle className="size-4" />}
          label="Problem type"
        >
          {incidentTypeLabels[incident.type]}
        </FactRow>
        <FactRow label="Description">{incident.description}</FactRow>
        <FactRow icon={<MapPin className="size-4" />} label="Location">
          {incident.location ?? "-"}
        </FactRow>
        <FactRow icon={<Truck className="size-4" />} label="Load">
          {incident.load.referenceNumber}
        </FactRow>
        <FactRow icon={<UserRound className="size-4" />} label="Driver">
          <span className="inline-flex min-w-0 items-center gap-2">
            {incident.load.driver ? (
              <DriverAvatar
                imageUrl={incident.load.driver.avatarUrl ?? ""}
                name={driverName}
                size="sm"
              />
            ) : null}
            <span>
              {driverName}
              {incident.load.driver?.truckNumber
                ? ` (${incident.load.driver.truckNumber})`
                : ""}
            </span>
          </span>
        </FactRow>
        <FactRow label="Reported at">
          {formatDateTime(incident.occurredAt)}
        </FactRow>
      </dl>

      {incident.photos.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary-600">Photos</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {incident.photos.slice(0, 4).map((photo) => (
              <a
                className="relative block aspect-square overflow-hidden rounded-lg border border-border bg-surface-100"
                href={photo}
                key={photo}
                rel="noreferrer"
                target="_blank"
              >
                <Image
                  alt="Incident attachment"
                  className="object-cover"
                  fill
                  src={photo}
                  unoptimized
                />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const FactRow = ({
  children,
  icon,
  label,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  label: string;
}): React.JSX.Element => (
  <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
    <dt className="text-sm font-medium text-primary-600">{label}</dt>
    <dd className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink-900">
      {icon ? (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-primary-700">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">{children}</span>
    </dd>
  </div>
);
