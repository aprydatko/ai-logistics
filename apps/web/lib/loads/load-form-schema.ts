import { z } from "zod";

export const loadFormSchema = z
  .object({
    referenceNumber: z.string().trim().min(1).max(100),
    status: z.enum([
      "pending",
      "assigned",
      "in_transit",
      "delivered",
      "cancelled",
    ]),
    pickupAddress: z.string().trim().min(2).max(500),
    deliveryAddress: z.string().trim().min(2).max(500),
    pickupDate: z.string().min(1, "Pickup date is required"),
    deliveryDate: z.string().min(1, "Delivery date is required"),
    weight: z.coerce.number().int().positive(),
    price: z.coerce.number().nonnegative(),
    miles: z.coerce.number().int().positive(),
    brokerId: z.string().trim().min(1).max(100),
    brokerCompanyName: z.string().trim().min(1).max(200),
    brokerPhone: z.string().trim().min(7).max(30),
    notes: z.string().trim().max(2000),
    routePoints: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(120),
          latitude: z.coerce.number().min(-90).max(90),
          longitude: z.coerce.number().min(-180).max(180),
        }),
      )
      .min(2, "Add at least pickup and delivery points"),
    timeline: z.array(
      z.object({
        title: z.string().trim().min(1).max(120),
        description: z.string().trim().max(500),
        dateTime: z.string().min(1),
      }),
    ),
  })
  .refine((value) => value.pickupAddress !== value.deliveryAddress, {
    message: "Destination must differ from pickup",
    path: ["deliveryAddress"],
  })
  .refine(
    (value) => new Date(value.deliveryDate) >= new Date(value.pickupDate),
    { message: "Delivery must be after pickup", path: ["deliveryDate"] },
  );

export type LoadFormValues = z.infer<typeof loadFormSchema>;
