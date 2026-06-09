import type { LoadRecord } from "../../db/schema";

export type LoadItem = Omit<
  LoadRecord,
  "createdAt" | "deliveryDate" | "pickupDate" | "price" | "updatedAt"
> & {
  createdAt: string;
  deliveryDate: string;
  pickupDate: string;
  price: number;
  updatedAt: string;
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

export type CreateLoadResponse = { success: true; data: LoadItem };
export type UpdateLoadResponse = { success: true; data: LoadItem };
export type AssignLoadDriverResponse = { success: true; data: LoadItem };
