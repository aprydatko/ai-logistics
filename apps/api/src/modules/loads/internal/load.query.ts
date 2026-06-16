import { eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";

import type { DatabaseService } from "../../../db/database.service";
import { drivers, loads } from "../../../db/schema";
import type { ListLoadsQueryDto } from "../dto/list-loads-query.dto";

/**
 * Builds an array of Drizzle SQL filter conditions from query parameters.
 *
 * Supports free-text search across referenceNumber, pickupAddress, and deliveryAddress.
 * Also filters by status, driverId, and pickup date range.
 *
 * @param query - Query parameters from ListLoadsQueryDto
 * @returns Array of SQL filter conditions (empty if no filters provided)
 */
export function buildLoadFilters(query: ListLoadsQueryDto): SQL[] {
  const filters: SQL[] = [];

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchFilter = or(
      ilike(loads.referenceNumber, pattern),
      ilike(loads.pickupAddress, pattern),
      ilike(loads.deliveryAddress, pattern),
    );
    if (searchFilter) filters.push(searchFilter);
  }
  if (query.status) filters.push(eq(loads.status, query.status));
  if (query.driverId) filters.push(eq(loads.driverId, query.driverId));
  if (query.pickupFrom) {
    filters.push(gte(loads.pickupDate, new Date(query.pickupFrom)));
  }
  if (query.pickupTo) {
    filters.push(lte(loads.pickupDate, new Date(query.pickupTo)));
  }

  return filters;
}

/**
 * Builds a Drizzle query builder for paginated load list with driver summary.
 *
 * Performs a LEFT JOIN with drivers to include driver summary fields
 * (id, firstName, lastName, avatarUrl, truckNumber) for each load.
 * Returns a query builder that can be further chained with where, orderBy, limit, offset.
 *
 * @param client - Database client from DatabaseService
 * @returns Query builder with load and driver fields selected
 */
export function loadListSelect(client: DatabaseService["client"]) {
  return client
    .select({
      load: loads,
      driver: {
        id: drivers.id,
        firstName: drivers.firstName,
        lastName: drivers.lastName,
        avatarUrl: drivers.avatarUrl,
        truckNumber: drivers.truckNumber,
      },
    })
    .from(loads)
    .leftJoin(drivers, eq(loads.driverId, drivers.id));
}
