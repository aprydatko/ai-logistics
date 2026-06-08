import type {
  DriverActivityRecord,
  DriverDocumentRecord,
  DriverRecord,
  LoadRecord,
  VehicleRecord,
} from "../../db/schema";

export type DriverListItem = Omit<
  DriverRecord,
  "createdAt" | "currentLocation" | "rating" | "updatedAt"
> & {
  currentLocation?: NonNullable<DriverRecord["currentLocation"]>;
  rating: number;
  createdAt: string;
  updatedAt: string;
};

export type DriversListResponse = {
  success: true;
  data: DriverListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DriverCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type DriverCandidatesResponse = {
  success: true;
  data: DriverCandidate[];
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
    currentVehicle:
      | (Omit<VehicleRecord, "createdAt" | "updatedAt"> & {
          assignedAt: string;
          createdAt: string;
          updatedAt: string;
        })
      | null;
    documents: Array<
      Omit<DriverDocumentRecord, "createdAt" | "updatedAt"> & {
        createdAt: string;
        updatedAt: string;
      }
    >;
    tripsHistory: DriverTrip[];
    activity: Array<
      Omit<DriverActivityRecord, "createdAt"> & {
        createdAt: string;
      }
    >;
  };
};
