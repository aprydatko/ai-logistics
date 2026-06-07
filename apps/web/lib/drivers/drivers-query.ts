import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

const driverSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  truckNumber: z.string(),
  trailerNumber: z.string(),
  isActive: z.boolean(),
  status: z.enum(["available", "on_trip", "off_duty", "maintenance"]),
  currentLocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const driversResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(driverSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type DriversApiItem = z.infer<typeof driverSchema>;
export type DriversFilters = {
  search: string;
  status: DriversApiItem["status"] | "all";
  isActive: "all" | "true" | "false";
  page: number;
  limit: number;
};
export type DriversResult = z.infer<typeof driversResponseSchema>;

const toSearchParams = (filters: DriversFilters): URLSearchParams => {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.isActive !== "all") params.set("isActive", filters.isActive);

  return params;
};

export const fetchDrivers = async (
  filters: DriversFilters,
): Promise<DriversResult> => {
  const response = await fetch(`/api/drivers?${toSearchParams(filters)}`);

  if (!response.ok) {
    throw new Error("Unable to load drivers");
  }

  const body: unknown = await response.json();
  const parsedResponse = driversResponseSchema.safeParse(body);

  if (!parsedResponse.success) {
    throw new Error("The drivers response has an invalid format");
  }

  return parsedResponse.data;
};

export const driversQueryOptions = (filters: DriversFilters) =>
  queryOptions({
    queryKey: ["drivers", filters],
    queryFn: () => fetchDrivers(filters),
  });
