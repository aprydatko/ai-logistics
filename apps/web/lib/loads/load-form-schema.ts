import { z } from "zod";

export const loadFormSchema = z
  .object({
    id: z.string().trim().min(1, "Load ID is required").max(50),
    status: z.enum([
      "In Transit",
      "Delayed",
      "Delivered",
      "Pending",
      "Assigned",
      "Cancelled",
    ]),
    priority: z.enum(["High", "Medium", "Low"]),
    cargo: z.string().trim().min(1, "Cargo is required").max(150),
    origin: z.string().trim().min(2, "Origin is required").max(200),
    destination: z.string().trim().min(2, "Destination is required").max(200),
    eta: z.string().min(1, "ETA is required"),
    distance: z.string().trim().min(1, "Distance is required").max(40),
    driverName: z.string().trim().max(120),
    truckId: z.string().trim().max(50),
    truckModel: z.string().trim().max(120),
    weight: z.string().trim().min(1, "Weight is required").max(50),
    customer: z.string().trim().min(1, "Customer is required").max(150),
    contact: z.string().trim().max(100),
    reference: z.string().trim().max(80),
    temperature: z.string().trim().max(40),
    notes: z.string().trim().max(250, "Notes must be 250 characters or less"),
    routePoints: z
      .array(
        z.object({
          label: z.string().trim().min(1, "Point name is required").max(120),
          latitude: z.coerce.number().min(-90).max(90),
          longitude: z.coerce.number().min(-180).max(180),
        }),
      )
      .min(2, "Add at least two route points"),
    timeline: z.array(
      z.object({
        dateTime: z.string().min(1, "Date and time are required"),
        description: z.string().trim().max(250),
        title: z.string().trim().min(1, "Event title is required").max(120),
      }),
    ),
  })
  .refine((values) => values.origin !== values.destination, {
    message: "Destination must differ from origin",
    path: ["destination"],
  })
  .refine(
    (values) =>
      (!values.driverName && !values.truckId) ||
      Boolean(values.driverName && values.truckId),
    {
      message: "Enter both driver and truck, or leave both empty",
      path: ["truckId"],
    },
  );

export type LoadFormValues = z.infer<typeof loadFormSchema>;
