import { eq, ilike, or, type SQL } from "drizzle-orm";

import { drivers } from "../../../db/schema";
import type { ListDriversQueryDto } from "../dto/list-drivers-query.dto";

/**
 * Builds an array of Drizzle SQL filter conditions from a list-drivers query.
 *
 * Applies free-text search across `driverCode`, `firstName`, `lastName`,
 * `phone`, `truckNumber`, and `trailerNumber` using case-insensitive ILIKE.
 * Adds exact filters for `isActive`, `status`, `truckNumber`, and
 * `trailerNumber` when those query fields are present.
 *
 * @param query - List-drivers query DTO with optional filter fields
 * @returns Array of SQL conditions to be combined with `and()`
 */
export function buildDriverFilters(query: ListDriversQueryDto): SQL[] {
  const filters: SQL[] = [];

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchFilter = or(
      ilike(drivers.driverCode, pattern),
      ilike(drivers.firstName, pattern),
      ilike(drivers.lastName, pattern),
      ilike(drivers.phone, pattern),
      ilike(drivers.truckNumber, pattern),
      ilike(drivers.trailerNumber, pattern),
    );

    if (searchFilter) filters.push(searchFilter);
  }

  if (query.isActive !== undefined) {
    filters.push(eq(drivers.isActive, query.isActive));
  }

  if (query.status) {
    filters.push(eq(drivers.status, query.status));
  }

  if (query.truckNumber) {
    filters.push(ilike(drivers.truckNumber, `%${query.truckNumber}%`));
  }

  if (query.trailerNumber) {
    filters.push(ilike(drivers.trailerNumber, `%${query.trailerNumber}%`));
  }

  return filters;
}
