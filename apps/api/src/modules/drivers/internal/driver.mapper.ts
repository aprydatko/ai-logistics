import type {
  DriverActivityRecord,
  DriverDocumentRecord,
  DriverRecord,
  LoadRecord,
  VehicleRecord,
} from "../../../db/schema";
import type { CreateDriverDto } from "../dto/create-driver.dto";
import type {
  DriverDocument,
  DriverListItem,
  DriverTrip,
} from "../drivers.types";

/**
 * Normalizes and trims all string fields of the create-driver DTO.
 *
 * Applies formatting rules: trims whitespace, lowercases email,
 * uppercases driverCode, coerces empty optional strings to null.
 *
 * @param dto - Raw create-driver payload from the request
 * @returns Normalized values ready for database insertion
 */
export function normalizeCreateDriverValues(dto: CreateDriverDto) {
  return {
    ...dto,
    firstName: dto.firstName.trim(),
    lastName: dto.lastName.trim(),
    email: dto.email.trim().toLowerCase(),
    driverCode: dto.driverCode.trim().toUpperCase(),
    phone: dto.phone.trim(),
    address: dto.address?.trim() || null,
    emergencyContact: dto.emergencyContact?.trim() || null,
    emergencyPhone: dto.emergencyPhone?.trim() || null,
    licenseNumber: dto.licenseNumber.trim(),
    licenseState: dto.licenseState.trim(),
    licenseType: dto.licenseType.trim(),
    notes: dto.notes?.trim() || null,
    truckNumber: dto.truckNumber?.trim() || null,
    trailerNumber: dto.trailerNumber?.trim() || null,
  };
}

/**
 * Maps a raw database driver record to the API list-item shape.
 *
 * Converts Date fields to ISO strings, casts the `rating` decimal to a
 * number, and promotes `currentLocation` from null to undefined.
 *
 * @param driver - Raw driver row from the database
 * @returns Driver shaped for list and detail API responses
 */
export function toDriverListItem(driver: DriverRecord): DriverListItem {
  return {
    ...driver,
    currentLocation: driver.currentLocation ?? undefined,
    rating: Number(driver.rating),
    createdAt: driver.createdAt.toISOString(),
    updatedAt: driver.updatedAt.toISOString(),
  };
}

/**
 * Maps a raw load record to the driver-trip shape.
 *
 * Converts Date fields (pickupDate, deliveryDate, createdAt, updatedAt)
 * to ISO strings and casts the `price` decimal to a number.
 *
 * @param load - Raw load row from the database
 * @returns Load shaped as a driver trip for the details response
 */
export function toDriverTrip(load: LoadRecord): DriverTrip {
  return {
    ...load,
    pickupDate: load.pickupDate.toISOString(),
    deliveryDate: load.deliveryDate.toISOString(),
    price: Number(load.price),
    createdAt: load.createdAt.toISOString(),
    updatedAt: load.updatedAt.toISOString(),
  };
}

/**
 * Maps a raw driver-document record to the API response shape.
 *
 * Converts `createdAt` and `updatedAt` Date fields to ISO strings.
 *
 * @param document - Raw driver document row from the database
 * @returns Driver document shaped for API responses
 */
export function toDriverDocumentItem(
  document: DriverDocumentRecord,
): DriverDocument {
  return {
    ...document,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

/**
 * Maps a raw driver-activity record to the API response shape.
 *
 * Converts the `createdAt` Date field to an ISO string.
 *
 * @param item - Raw driver activity row from the database
 * @returns Activity item with createdAt as a string
 */
export function toDriverActivityItem(
  item: DriverActivityRecord,
): Omit<DriverActivityRecord, "createdAt"> & { createdAt: string } {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
  };
}

/**
 * Maps a vehicle record and its assignment timestamp to the API response shape.
 *
 * Converts `createdAt`, `updatedAt`, and `assignedAt` Date values to ISO strings.
 *
 * @param vehicle - Raw vehicle row from the database
 * @param assignedAt - Date when the vehicle was assigned to the driver
 * @returns Vehicle item with all Date fields serialized as ISO strings
 */
export function toDriverVehicleItem(
  vehicle: VehicleRecord,
  assignedAt: Date,
): Omit<VehicleRecord, "createdAt" | "updatedAt"> & {
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
} {
  return {
    ...vehicle,
    assignedAt: assignedAt.toISOString(),
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };
}
