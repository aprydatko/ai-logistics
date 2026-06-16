import type { UpdateDriverDto } from "../dto/update-driver.dto";

/**
 * Returns a list of human-readable labels for fields that were changed in an update.
 *
 * Iterates over a predefined map of DTO field keys to display labels and
 * returns only the labels for keys that are present (not undefined) in the
 * provided DTO. Used to construct descriptive activity log messages.
 *
 * @param dto - Partial update-driver DTO
 * @returns Array of human-readable field label strings that were updated
 */
export function getUpdatedDriverFields(dto: UpdateDriverDto): string[] {
  const fieldLabels: Partial<Record<keyof UpdateDriverDto, string>> = {
    userId: "linked user",
    driverCode: "driver code",
    firstName: "first name",
    lastName: "last name",
    email: "email",
    phone: "phone",
    avatarUrl: "avatar",
    dateOfBirth: "date of birth",
    address: "address",
    hireDate: "hire date",
    licenseType: "license type",
    licenseNumber: "license number",
    licenseExpirationDate: "license expiration date",
    licenseState: "license state",
    emergencyContact: "emergency contact",
    emergencyPhone: "emergency phone",
    notes: "notes",
    truckNumber: "truck number",
    trailerNumber: "trailer number",
    isActive: "active flag",
  };

  return Object.entries(fieldLabels)
    .filter(([field]) => dto[field as keyof UpdateDriverDto] !== undefined)
    .map(([, label]) => label ?? "");
}
