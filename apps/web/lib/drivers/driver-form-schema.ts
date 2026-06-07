import { z } from "zod";

export const driverFormSchema = z.object({
  driverCode: z.string().trim().min(1, "Driver ID is required").max(50),
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  email: z.string().email("Enter a valid email"),
  avatarUrl: z.string().max(2_000_000).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().trim().max(255).optional(),
  hireDate: z.string().optional(),
  licenseType: z.string().trim().min(1, "License type is required").max(30),
  licenseNumber: z.string().trim().min(1, "License number is required").max(80),
  licenseExpirationDate: z.string().min(1, "Expiration date is required"),
  licenseState: z.string().trim().min(1, "State is required").max(80),
  emergencyContact: z.string().trim().max(200).optional(),
  emergencyPhone: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(2000).optional(),
  truckNumber: z.string().trim().max(50).optional(),
  trailerNumber: z.string().trim().max(50).optional(),
  status: z.enum(["available", "on_trip", "off_duty", "maintenance"]),
  isActive: z.boolean(),
});

export type DriverFormValues = z.infer<typeof driverFormSchema>;
