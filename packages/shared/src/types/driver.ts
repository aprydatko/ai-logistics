import type { BaseEntity, Coordinates } from './common.js';
import type { User } from './user.js';

export interface Driver extends BaseEntity {
  userId: string;
  user?: User;

  firstName: string;
  lastName: string;
  phone: string;

  truckNumber: string;
  trailerNumber: string;

  isActive: boolean;
  currentLocation?: Coordinates;
}

export interface DriverWithUser extends Driver {
  user: User;
}
