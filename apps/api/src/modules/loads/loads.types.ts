import type { LoadRecord } from "../../db/schema";

type LoadBaseItem = Omit<
  LoadRecord,
  "createdAt" | "deliveryDate" | "pickupDate" | "price" | "updatedAt"
> & {
  createdAt: string;
  deliveryDate: string;
  pickupDate: string;
  price: number;
  updatedAt: string;
};

export type LoadDriverSummary = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  truckNumber: string | null;
};

export type LoadItem = LoadBaseItem & {
  driver: LoadDriverSummary | null;
};

export type LoadsListResponse = {
  success: true;
  data: LoadItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type LoadResponse = { success: true; data: LoadItem };
export type CreateLoadResponse = { success: true; data: LoadItem };
export type UpdateLoadResponse = { success: true; data: LoadItem };
export type AssignLoadDriverResponse = { success: true; data: LoadItem };
