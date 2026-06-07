import type { DriverFormValues } from "@/lib/drivers/driver-form-schema";
import type { DriversApiItem } from "@/lib/drivers/drivers-query";

export const emptyDriverFormValues: DriverFormValues = {
  driverCode: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  avatarUrl: "",
  dateOfBirth: "",
  address: "",
  hireDate: "",
  licenseType: "CDL-A",
  licenseNumber: "",
  licenseExpirationDate: "",
  licenseState: "",
  emergencyContact: "",
  emergencyPhone: "",
  notes: "",
  truckNumber: "",
  trailerNumber: "",
  status: "available",
  isActive: true,
};

export const toDriverFormValues = (
  driver: DriversApiItem | null,
): DriverFormValues =>
  driver
    ? {
        driverCode: driver.driverCode,
        firstName: driver.firstName,
        lastName: driver.lastName,
        phone: driver.phone,
        email: driver.email,
        avatarUrl: driver.avatarUrl ?? "",
        dateOfBirth: driver.dateOfBirth ?? "",
        address: driver.address ?? "",
        hireDate: driver.hireDate ?? "",
        licenseType: driver.licenseType ?? "CDL-A",
        licenseNumber: driver.licenseNumber ?? "",
        licenseExpirationDate: driver.licenseExpirationDate ?? "",
        licenseState: driver.licenseState ?? "",
        emergencyContact: driver.emergencyContact ?? "",
        emergencyPhone: driver.emergencyPhone ?? "",
        notes: driver.notes ?? "",
        truckNumber: driver.truckNumber ?? "",
        trailerNumber: driver.trailerNumber ?? "",
        status: driver.status,
        isActive: driver.isActive,
      }
    : emptyDriverFormValues;

export const driverFieldClassName = "h-10 bg-white";
