import {
  Activity,
  ClipboardCheck,
  Edit3,
  FileBadge,
  FileText,
  MapPin,
  Route,
  Star,
  Truck,
} from "lucide-react";

import type { DriverDetails } from "@/lib/drivers/drivers-query";
import { Button } from "@repo/ui/components/button";
import { StatusBadge } from "@repo/ui/components/status-badge";

import { driverStatusTone } from "../driver-styles";
import type { DriverRow } from "../types";
import { EmptyTab, PanelSection } from "./panel-section";
import {
  formatDate,
  formatTimestamp,
  getDocumentStatus,
} from "./profile-formatters";
import type { ProfileTab } from "./profile-header";

const documentIcon = {
  license: FileBadge,
  medical_card: ClipboardCheck,
  insurance: FileText,
  other: FileText,
} as const;

const ProfileSummary = ({
  details,
  driver,
  onEdit,
}: {
  details: DriverDetails;
  driver: DriverRow;
  onEdit: (driver: DriverRow) => void;
}): React.JSX.Element => {
  const completedTrips = details.tripsHistory.filter(
    (trip) => trip.status === "delivered",
  ).length;

  return (
    <PanelSection
      action={
        <Button
          onClick={() => onEdit(driver)}
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
          <p className="text-sm text-primary-700">Status</p>
          <StatusBadge className="mt-3" tone={driverStatusTone[driver.status]}>
            {driver.status}
          </StatusBadge>
        </div>
        {details.licenseType ? (
          <div className="rounded-md border border-border p-3">
            <p className="text-sm text-primary-700">License</p>
            <p className="mt-2 font-bold text-ink-900">{details.licenseType}</p>
            <p className="mt-1 text-xs text-primary-700">
              Expires: {formatDate(details.licenseExpirationDate)}
            </p>
          </div>
        ) : null}
        <div className="rounded-md border border-border p-3">
          <p className="text-sm text-primary-700">Rating</p>
          <div className="mt-2 flex items-center gap-1 font-semibold text-ink-900">
            <Star className="size-5 fill-warning text-warning" />
            {details.rating.toFixed(1)} / 5
          </div>
          <p className="mt-1 text-xs text-primary-700">
            {completedTrips} completed trips
          </p>
        </div>
      </div>
    </PanelSection>
  );
};

const TruckTab = ({
  details,
}: {
  details: DriverDetails;
}): React.JSX.Element => {
  if (!details.currentVehicle) return <EmptyTab label="Truck" />;

  const vehicle = details.currentVehicle;
  const vehicleName = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");

  return (
    <PanelSection title="Assigned vehicle">
      <div className="flex gap-5 px-4">
        <div className="flex size-20 items-center justify-center rounded-md bg-surface-100">
          <Truck className="size-9 text-primary-700" />
        </div>
        <div>
          <h3 className="font-bold text-ink-900">{vehicle.unitNumber}</h3>
          {vehicleName ? (
            <p className="text-sm text-primary-700">{vehicleName}</p>
          ) : null}
          {vehicle.licensePlate ? (
            <p className="mt-3 text-sm">Plate: {vehicle.licensePlate}</p>
          ) : null}
          {vehicle.odometerMiles !== null ? (
            <p className="text-sm">
              Odometer: {vehicle.odometerMiles.toLocaleString()} mi
            </p>
          ) : null}
          {vehicle.lastServiceAt ? (
            <p className="text-sm">
              Last service: {formatDate(vehicle.lastServiceAt)}
            </p>
          ) : null}
        </div>
      </div>
    </PanelSection>
  );
};

const InfoTab = ({
  details,
}: {
  details: DriverDetails;
}): React.JSX.Element => {
  const hasInfo = Boolean(
    details.address ||
    details.hireDate ||
    details.dateOfBirth ||
    details.emergencyContact ||
    details.notes,
  );

  if (!hasInfo) return <EmptyTab label="Driver information" />;

  return (
    <PanelSection title="Driver information">
      <div className="grid gap-3 px-4 text-sm">
        {details.address ? (
          <p>
            <MapPin className="mr-2 inline size-4" />
            {details.address}
          </p>
        ) : null}
        {details.hireDate ? (
          <p>Hire date: {formatDate(details.hireDate)}</p>
        ) : null}
        {details.dateOfBirth ? (
          <p>Date of birth: {formatDate(details.dateOfBirth)}</p>
        ) : null}
        {details.emergencyContact ? (
          <p>
            Emergency contact: {details.emergencyContact}
            {details.emergencyPhone ? `, ${details.emergencyPhone}` : ""}
          </p>
        ) : null}
        {details.notes ? (
          <p className="text-primary-700">{details.notes}</p>
        ) : null}
      </div>
    </PanelSection>
  );
};

const DocumentsTab = ({
  details,
}: {
  details: DriverDetails;
}): React.JSX.Element => {
  if (!details.documents.length) return <EmptyTab label="Documents" />;

  return (
    <PanelSection title="Documents">
      <div className="divide-y divide-border/70 px-4">
        {details.documents.map((document) => {
          const Icon = documentIcon[document.type];
          const status = getDocumentStatus(document.expiresAt);

          return (
            <div className="flex items-center gap-3 py-3" key={document.id}>
              <Icon className="size-5 text-primary-700" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{document.name}</p>
                {document.expiresAt ? (
                  <p className="text-xs text-primary-700">
                    Expires {formatDate(document.expiresAt)}
                  </p>
                ) : null}
              </div>
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            </div>
          );
        })}
      </div>
    </PanelSection>
  );
};

const TripsTab = ({
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

const ActivityTab = ({
  details,
}: {
  details: DriverDetails;
}): React.JSX.Element => {
  if (!details.activity.length) return <EmptyTab label="Activity" />;

  return (
    <PanelSection title="Recent activity">
      <div className="divide-y divide-border/70 px-4">
        {details.activity.map((item) => (
          <div className="flex gap-3 py-3" key={item.id}>
            <Activity className="mt-0.5 size-4 text-primary-700" />
            <div>
              <p className="text-sm font-medium">{item.description}</p>
              <p className="text-xs text-primary-700">
                {formatTimestamp(item.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </PanelSection>
  );
};

export const ProfileTabContent = ({
  activeTab,
  details,
  driver,
  onEdit,
}: {
  activeTab: ProfileTab;
  details: DriverDetails;
  driver: DriverRow;
  onEdit: (driver: DriverRow) => void;
}): React.JSX.Element => {
  if (activeTab === "Profile") {
    return <ProfileSummary details={details} driver={driver} onEdit={onEdit} />;
  }
  if (activeTab === "Truck") return <TruckTab details={details} />;
  if (activeTab === "Info") return <InfoTab details={details} />;
  if (activeTab === "Docs") return <DocumentsTab details={details} />;
  if (activeTab === "Trips") return <TripsTab details={details} />;

  return <ActivityTab details={details} />;
};
