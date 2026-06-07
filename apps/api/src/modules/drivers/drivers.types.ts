import type { DriverRecord, LoadRecord } from "../../db/schema";

export type DriverListItem = Omit<
  DriverRecord,
  "createdAt" | "currentLocation" | "updatedAt"
> & {
  currentLocation?: NonNullable<DriverRecord["currentLocation"]>;
  createdAt: string;
  updatedAt: string;
};

export type DriversListResponse = {
  success: true;
  data: DriverListItem[];
};

export type CreateDriverResponse = {
  success: true;
  data: DriverListItem;
};

export type UpdateDriverResponse = {
  success: true;
  data: DriverListItem;
};

export type DeleteDriverResponse = {
  success: true;
  message: string;
};

export type DriverTrip = Omit<
  LoadRecord,
  "createdAt" | "deliveryDate" | "pickupDate" | "price" | "updatedAt"
> & {
  createdAt: string;
  deliveryDate: string;
  pickupDate: string;
  price: number;
  updatedAt: string;
};

export type DriverDetailsResponse = {
  success: true;
  data: DriverListItem & {
    tripsHistory: DriverTrip[];
  };
};
