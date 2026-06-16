import type { LoadRecord } from "../../../db/schema";
import type { CreateLoadDto } from "../dto/create-load.dto";
import type { LoadDriverSummary, LoadItem } from "../loads.types";

/**
 * Transforms a CreateLoadDto into database insert values.
 *
 * Normalizes string fields: trims whitespace, uppercases referenceNumber,
 * converts dates to Date objects, and converts price to string.
 *
 * @param dto - Load creation payload from API request
 * @returns Database-ready values object for load insertion
 */
export function toCreateLoadValues(dto: CreateLoadDto) {
  return {
    ...dto,
    referenceNumber: dto.referenceNumber.trim().toUpperCase(),
    pickupAddress: dto.pickupAddress.trim(),
    deliveryAddress: dto.deliveryAddress.trim(),
    pickupDate: new Date(dto.pickupDate),
    deliveryDate: new Date(dto.deliveryDate),
    price: String(dto.price),
    notes: dto.notes?.trim() || null,
  };
}

/**
 * Transforms a database LoadRecord into an API LoadItem response.
 *
 * Converts Date fields to ISO strings, converts price from string to number,
 * and attaches the driver summary if provided.
 *
 * @param load - Database load record
 * @param driver - Driver summary or null if no driver assigned
 * @returns API-ready load item with serialized dates and driver data
 */
export function toLoadItem(
  load: LoadRecord,
  driver: LoadItem["driver"],
): LoadItem {
  return {
    ...load,
    pickupDate: load.pickupDate.toISOString(),
    deliveryDate: load.deliveryDate.toISOString(),
    price: Number(load.price),
    createdAt: load.createdAt.toISOString(),
    updatedAt: load.updatedAt.toISOString(),
    driver,
  };
}

/**
 * Row type returned from the paginated load list query.
 * Contains the load record and optional driver summary from LEFT JOIN.
 */
export type LoadListRow = {
  load: LoadRecord;
  driver: LoadDriverSummary | null;
};

/**
 * Transforms a LoadListRow into an API LoadItem response.
 *
 * Delegates to toLoadItem but ensures driver is null if the driver
 * summary has no id (handles edge case from LEFT JOIN).
 *
 * @param row - Query result row with load and optional driver
 * @returns API-ready load item
 */
export function toLoadListItem({ load, driver }: LoadListRow): LoadItem {
  return toLoadItem(load, driver?.id ? driver : null);
}
