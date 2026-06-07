import type { DriverRecord } from "../../db/schema";

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
