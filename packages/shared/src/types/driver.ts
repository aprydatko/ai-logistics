import type { BaseEntity, Coordinates } from "./common.js";
import type { User } from "./user.js";

export type DriverStatus = "available" | "on_trip" | "off_duty" | "maintenance";

export interface Driver extends BaseEntity {
  userId: string;
  user?: User;

  firstName: string;
  lastName: string;
  phone: string;

  truckNumber: string;
  trailerNumber: string;

  isActive: boolean;
  status: DriverStatus;
  currentLocation?: Coordinates;
}

export interface DriverWithUser extends Driver {
  user: User;
}
