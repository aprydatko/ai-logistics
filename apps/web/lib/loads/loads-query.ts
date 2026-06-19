import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { z } from "zod";

const loadStatusSchema = z.enum([
  "pending",
  "assigned",
  "in_transit",
  "delivered",
  "cancelled",
]);

export const loadSchema = z.object({
  id: z.string().uuid(),
  referenceNumber: z.string(),
  pickupAddress: z.string(),
  deliveryAddress: z.string(),
  pickupDate: z.string(),
  deliveryDate: z.string(),
  weight: z.number().int(),
  price: z.number(),
  miles: z.number().int(),
  notes: z.string().nullable(),
  status: loadStatusSchema,
  broker: z.object({
    id: z.string(),
    companyName: z.string(),
    phone: z.string(),
  }),
  routePoints: z.array(
    z.object({
      label: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    }),
  ),
  timeline: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      dateTime: z.string(),
    }),
  ),
  driverId: z.string().uuid().nullable(),
  driver: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
      avatarUrl: z.string().nullable(),
      truckNumber: z.string().nullable(),
    })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const loadsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(loadSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type LoadApiItem = z.infer<typeof loadSchema>;
export type LoadStatus = z.infer<typeof loadStatusSchema>;
export type LoadsFilters = {
  search: string;
  status: LoadStatus | "all";
  pickupFrom: string;
  pickupTo: string;
  page: number;
  limit: number;
};
export type LoadsResult = z.infer<typeof loadsResponseSchema>;

export const loadsQueryKeys = {
  all: ["loads"] as const,
  detail: (loadId: string) => [...loadsQueryKeys.all, loadId] as const,
  list: (filters: LoadsFilters) => [...loadsQueryKeys.all, filters] as const,
};

const toSearchParams = (filters: LoadsFilters): URLSearchParams => {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });

  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.pickupFrom) params.set("pickupFrom", filters.pickupFrom);
  if (filters.pickupTo) params.set("pickupTo", filters.pickupTo);

  return params;
};

export const fetchLoads = async (
  filters: LoadsFilters,
): Promise<LoadsResult> => {
  const response = await fetch(`/api/loads?${toSearchParams(filters)}`);
  if (!response.ok) throw new Error("Unable to load loads");

  const body: unknown = await response.json();
  const parsed = loadsResponseSchema.safeParse(body);
  if (!parsed.success)
    throw new Error("The loads response has an invalid format");

  return parsed.data;
};

export const loadsQueryOptions = (filters: LoadsFilters) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryKey: loadsQueryKeys.list(filters),
    queryFn: () => fetchLoads(filters),
  });

export const updateLoadInLists = (
  current: LoadsResult | undefined,
  nextLoad: LoadApiItem,
): LoadsResult | undefined => {
  if (!current) return current;

  const hasExisting = current.data.some((load) => load.id === nextLoad.id);

  return {
    ...current,
    data: hasExisting
      ? current.data.map((load) => (load.id === nextLoad.id ? nextLoad : load))
      : [nextLoad, ...current.data],
  };
};

export const syncLoadCache = (
  queryClient: QueryClient,
  load: LoadApiItem,
): void => {
  queryClient.setQueriesData(
    { queryKey: loadsQueryKeys.all },
    (current: LoadsResult | undefined) => updateLoadInLists(current, load),
  );
  queryClient.setQueryData(loadsQueryKeys.detail(load.id), load);
};
