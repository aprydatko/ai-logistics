import { BadRequestException, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";

import type { DatabaseService } from "../../../db/database.service";
import { loads } from "../../../db/schema";
import type { UpdateLoadDto } from "../dto/update-load.dto";

/**
 * Validates that delivery date is not before pickup date.
 *
 * Throws a BadRequestException if deliveryDate precedes pickupDate.
 * Used during load creation and update to ensure date consistency.
 *
 * @param pickupDate - Pickup date as ISO string
 * @param deliveryDate - Delivery date as ISO string
 * @throws BadRequestException if delivery date is before pickup date
 */
export function assertLoadDateOrder(
  pickupDate: string,
  deliveryDate: string,
): void {
  if (new Date(deliveryDate) < new Date(pickupDate)) {
    throw new BadRequestException(
      "Delivery date must be on or after pickup date",
    );
  }
}

/**
 * Validates date order for load updates, merging with persisted dates.
 *
 * If the update DTO includes pickupDate or deliveryDate, fetches the
 * current load from the database and validates the combined dates.
 * Uses existing persisted dates for any fields not being updated.
 * Skips validation if neither date field is being updated.
 *
 * @param client - Database client from DatabaseService
 * @param id - Load UUID to fetch current dates from
 * @param dto - Update payload with optional date fields
 * @throws NotFoundException if load does not exist
 * @throws BadRequestException if resulting date order is invalid
 */
export async function assertUpdatedLoadDateOrder(
  client: DatabaseService["client"],
  id: string,
  dto: UpdateLoadDto,
): Promise<void> {
  if (!dto.pickupDate && !dto.deliveryDate) return;

  const [current] = await client
    .select({
      pickupDate: loads.pickupDate,
      deliveryDate: loads.deliveryDate,
    })
    .from(loads)
    .where(eq(loads.id, id))
    .limit(1);

  if (!current) throw new NotFoundException("Load was not found");
  assertLoadDateOrder(
    dto.pickupDate ?? current.pickupDate.toISOString(),
    dto.deliveryDate ?? current.deliveryDate.toISOString(),
  );
}
