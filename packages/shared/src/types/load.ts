import type { BaseEntity, ISODateString } from "./common.js";
import type { Driver } from "./driver.js";

export type LoadStatus =
  | "new"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface Broker {
  id: string;
  companyName: string;
  phone: string;
}

export interface Load extends BaseEntity {
  referenceNumber: string;

  pickupAddress: string;
  deliveryAddress: string;

  pickupDate: ISODateString;
  deliveryDate: ISODateString;

  weight: number;
  price: number;
  miles: number;

  notes?: string;
  status: LoadStatus;

  broker: Broker;
  driverId?: string;
}

export interface LoadWithDriver extends Load {
  driver: Driver;
  driverId: string;
}
