import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

const driverSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  driverCode: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  avatarUrl: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  address: z.string().nullable(),
  hireDate: z.string().nullable(),
  licenseType: z.string().nullable(),
  licenseNumber: z.string().nullable(),
  licenseExpirationDate: z.string().nullable(),
  licenseState: z.string().nullable(),
  emergencyContact: z.string().nullable(),
  emergencyPhone: z.string().nullable(),
  notes: z.string().nullable(),
  rating: z.number(),
  truckNumber: z.string().nullable(),
  trailerNumber: z.string().nullable(),
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

const driverDocumentSchema = z.object({
  id: z.string().uuid(),
  driverId: z.string().uuid(),
  type: z.enum(["license", "medical_card", "insurance", "other"]),
  name: z.string(),
  documentNumber: z.string().nullable(),
  fileUrl: z.string().nullable(),
  storageKey: z.string().nullable(),
  mimeType: z.string().nullable(),
  fileSize: z.number().nullable(),
  issuedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const vehicleSchema = z.object({
  id: z.string().uuid(),
  unitNumber: z.string(),
  type: z.string(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  year: z.number().nullable(),
  vin: z.string().nullable(),
  licensePlate: z.string().nullable(),
  licenseState: z.string().nullable(),
  odometerMiles: z.number().nullable(),
  status: z.enum(["active", "maintenance", "inactive"]),
  lastServiceAt: z.string().nullable(),
  nextServiceAt: z.string().nullable(),
  assignedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const driverTripSchema = z.object({
  id: z.string().uuid(),
  referenceNumber: z.string(),
  pickupAddress: z.string(),
  deliveryAddress: z.string(),
  pickupDate: z.string(),
  deliveryDate: z.string(),
  weight: z.number(),
  price: z.number(),
  miles: z.number(),
  notes: z.string().nullable(),
  status: z.enum(["new", "assigned", "in_transit", "delivered", "cancelled"]),
  broker: z.object({
    id: z.string(),
    companyName: z.string(),
    phone: z.string(),
  }),
  driverId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const driverActivitySchema = z.object({
  id: z.string().uuid(),
  driverId: z.string().uuid(),
  type: z.enum([
    "created",
    "updated",
    "status_changed",
    "document_added",
    "vehicle_assigned",
    "trip_assigned",
    "trip_completed",
  ]),
  description: z.string(),
  metadata: z.record(z.unknown()).nullable(),
  actorUserId: z.string().uuid().nullable(),
  createdAt: z.string(),
});

const driverDetailsResponseSchema = z.object({
  success: z.literal(true),
  data: driverSchema.extend({
    currentVehicle: vehicleSchema.nullable(),
    documents: z.array(driverDocumentSchema),
    tripsHistory: z.array(driverTripSchema),
    activity: z.array(driverActivitySchema),
  }),
});

export type DriverDetails = z.infer<typeof driverDetailsResponseSchema>["data"];

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
    placeholderData: keepPreviousData,
    queryKey: ["drivers", filters],
    queryFn: () => fetchDrivers(filters),
  });

export const driverDetailsQueryOptions = (driverId: string) =>
  queryOptions({
    enabled: Boolean(driverId),
    queryKey: ["drivers", driverId],
    queryFn: async (): Promise<DriverDetails> => {
      const response = await fetch(`/api/drivers/${driverId}`);

      if (!response.ok) {
        throw new Error("Unable to load driver details");
      }

      const body: unknown = await response.json();
      const parsedResponse = driverDetailsResponseSchema.safeParse(body);

      if (!parsedResponse.success) {
        throw new Error("The driver details response has an invalid format");
      }

      return parsedResponse.data.data;
    },
  });
