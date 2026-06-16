import { BadRequestException, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";

import type { DatabaseService } from "../../../db/database.service";
import { drivers, users } from "../../../db/schema";

/**
 * Asserts that a user exists and has the "driver" role.
 *
 * Used before linking a user account to a driver profile to prevent
 * assigning non-driver users.
 *
 * @param client - Drizzle database client
 * @param userId - UUID of the user to validate
 * @throws BadRequestException if the user does not exist or is not a driver
 */
export async function assertDriverUser(
  client: DatabaseService["client"],
  userId: string,
): Promise<void> {
  const [user] = await client
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.role !== "driver") {
    throw new BadRequestException("Driver user was not found");
  }
}

/**
 * Asserts that a driver record exists in the database.
 *
 * Performs a lightweight SELECT of only the id column to minimise I/O.
 * Used as a pre-condition guard before operating on a driver's sub-resources.
 *
 * @param client - Drizzle database client
 * @param driverId - UUID of the driver to verify
 * @throws NotFoundException if no matching driver record is found
 */
export async function assertDriverExists(
  client: DatabaseService["client"],
  driverId: string,
): Promise<void> {
  const [driver] = await client
    .select({ id: drivers.id })
    .from(drivers)
    .where(eq(drivers.id, driverId))
    .limit(1);

  if (!driver) {
    throw new NotFoundException("Driver was not found");
  }
}
