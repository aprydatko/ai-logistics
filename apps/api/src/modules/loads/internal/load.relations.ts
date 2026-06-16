import { BadRequestException } from "@nestjs/common";
import { eq } from "drizzle-orm";

import type { DatabaseService } from "../../../db/database.service";
import { drivers } from "../../../db/schema";
import type { LoadDriverSummary } from "../loads.types";

/**
 * Asserts that a driver exists in the database.
 *
 * Queries the drivers table by id and throws a BadRequestException
 * if no driver is found. Used to validate driverId references before
 * creating or updating loads.
 *
 * @param client - Database client from DatabaseService
 * @param driverId - Driver UUID to validate
 * @throws BadRequestException if driver does not exist
 */
export async function assertLoadDriverExists(
  client: DatabaseService["client"],
  driverId: string,
): Promise<void> {
  const [driver] = await client
    .select({ id: drivers.id })
    .from(drivers)
    .where(eq(drivers.id, driverId))
    .limit(1);

  if (!driver) throw new BadRequestException("Driver was not found");
}

/**
 * Fetches a driver summary by ID for load response inclusion.
 *
 * Queries the drivers table and returns a summary object with
 * id, firstName, lastName, avatarUrl, and truckNumber. Returns null
 * if the driver is not found (graceful handling for deleted drivers).
 *
 * @param client - Database client from DatabaseService
 * @param driverId - Driver UUID to fetch
 * @returns Driver summary object or null if not found
 */
export async function findLoadDriverSummary(
  client: DatabaseService["client"],
  driverId: string,
): Promise<LoadDriverSummary | null> {
  const [driver] = await client
    .select({
      id: drivers.id,
      firstName: drivers.firstName,
      lastName: drivers.lastName,
      avatarUrl: drivers.avatarUrl,
      truckNumber: drivers.truckNumber,
    })
    .from(drivers)
    .where(eq(drivers.id, driverId))
    .limit(1);

  return driver ?? null;
}
