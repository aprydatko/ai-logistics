import type { BaseEntity, Coordinates } from "./common.js";
import type { User } from "./user.js";

export type DriverStatus = "available" | "on_trip" | "off_duty" | "maintenance";

export interface Driver extends BaseEntity {
  userId?: string;
  user?: User;
  driverCode: string;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  address?: string;
  hireDate?: string;
  licenseType?: string;
  licenseNumber?: string;
  licenseExpirationDate?: string;
  licenseState?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;

  truckNumber?: string;
  trailerNumber?: string;

  isActive: boolean;
  status: DriverStatus;
  currentLocation?: Coordinates;
}

export interface DriverWithUser extends Driver {
  user: User;
}
