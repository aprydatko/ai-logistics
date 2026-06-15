import {
  CalendarDays,
  Edit3,
  MapPin,
  NotebookText,
  Phone,
  Star,
  type LucideIcon,
} from "lucide-react";

import type { DriverDetails } from "@/lib/drivers/drivers-query";
import { Button } from "@repo/ui/components/button";
import { StatusBadge } from "@repo/ui/components/status-badge";

import { driverStatusTone } from "../../driver-styles";
import type { DriverRow } from "../../types";
import { PanelSection } from "../panel-section";
import { formatDate } from "../profile-formatters";

type ProfileTabViewProps = {
  details: DriverDetails;
  driver: DriverRow;
  onEdit: (driver: DriverRow) => void;
};

export const ProfileTabView = ({
  details,
  driver,
  onEdit,
}: ProfileTabViewProps): React.JSX.Element => {
  const completedTrips = details.tripsHistory.filter(
    (trip) => trip.status === "delivered",
  ).length;

  return (
    <>
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
            <StatusBadge
              className="mt-3"
              tone={driverStatusTone[driver.status]}
            >
              {driver.status}
            </StatusBadge>
          </div>
          {details.licenseType ? (
            <div className="rounded-md border border-border p-3">
              <p className="text-sm text-primary-700">License</p>
              <p className="mt-2 font-bold text-ink-900">
                {details.licenseType}
              </p>
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
      <DriverInformation details={details} />
    </>
  );
};

const DriverInformation = ({
  details,
}: {
  details: DriverDetails;
}): React.JSX.Element | null => {
  const hasInfo = Boolean(
    details.address ||
    details.hireDate ||
    details.dateOfBirth ||
    details.emergencyContact ||
    details.notes,
  );

  if (!hasInfo) return null;

  return (
    <PanelSection title="Driver information">
      <dl className="grid grid-cols-2 gap-3 px-4 max-sm:grid-cols-1">
        {details.hireDate ? (
          <InfoItem
            icon={CalendarDays}
            label="Hire date"
            value={formatDate(details.hireDate)}
          />
        ) : null}
        {details.dateOfBirth ? (
          <InfoItem
            icon={CalendarDays}
            label="Date of birth"
            value={formatDate(details.dateOfBirth)}
          />
        ) : null}
        {details.emergencyContact ? (
          <InfoItem
            icon={Phone}
            label="Emergency contact"
            value={`${details.emergencyContact}${details.emergencyPhone ? ` · ${details.emergencyPhone}` : ""}`}
          />
        ) : null}
        {details.address ? (
          <InfoItem icon={MapPin} label="Address" value={details.address} />
        ) : null}
        {details.notes ? (
          <InfoItem
            className="col-span-2 max-sm:col-span-1"
            icon={NotebookText}
            label="Notes"
            value={details.notes}
          />
        ) : null}
      </dl>
    </PanelSection>
  );
};

type InfoItemProps = {
  className?: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

const InfoItem = ({
  className,
  icon: Icon,
  label,
  value,
}: InfoItemProps): React.JSX.Element => (
  <div
    className={`flex min-h-24 items-center gap-3 rounded-md border border-border bg-white p-3 ${className ?? ""}`}
  >
    <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-100 text-primary-700">
      <Icon className="size-5" />
    </div>
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase text-primary-700">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-bold leading-5 text-ink-900">
        {value}
      </dd>
    </div>
  </div>
);
