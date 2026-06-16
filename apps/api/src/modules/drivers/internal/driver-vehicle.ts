import { BadRequestException } from "@nestjs/common";

import type { UpsertDriverVehicleDto } from "../dto/upsert-driver-vehicle.dto";
import { MAX_TRUCK_IMAGE_BYTES } from "./driver.constants";

/**
 * Validates the decoded size of a base64-encoded truck image.
 *
 * Skips validation if no image content is provided. Throws if the decoded
 * size exceeds the maximum allowed truck image size (2 MB).
 *
 * @param dto - Vehicle upsert DTO that may include base64 image content
 * @throws BadRequestException if the decoded image exceeds the size limit
 */
export function assertTruckImageSize(dto: UpsertDriverVehicleDto): void {
  if (!dto.imageContent) return;

  const imageSize = Buffer.byteLength(dto.imageContent, "base64");
  if (imageSize > MAX_TRUCK_IMAGE_BYTES) {
    throw new BadRequestException("Truck image must be 2 MB or smaller");
  }
}

/**
 * Builds the normalized vehicle column values from the upsert DTO.
 *
 * Trims and uppercases the unit number and license plate, trims make/model,
 * and constructs the `imageUrl` data-URL when both `imageContent` and
 * `imageMimeType` are provided. Always sets `updatedAt` to the current time.
 *
 * @param dto - Vehicle upsert DTO
 * @returns Object ready to be passed to a Drizzle insert or update call
 */
export function buildVehicleValues(dto: UpsertDriverVehicleDto) {
  return {
    unitNumber: dto.unitNumber.trim().toUpperCase(),
    type: dto.type.trim(),
    make: dto.make?.trim() || null,
    model: dto.model?.trim() || null,
    year: dto.year,
    licensePlate: dto.licensePlate?.trim().toUpperCase() || null,
    odometerMiles: dto.odometerMiles,
    status: dto.status,
    lastServiceAt: dto.lastServiceAt,
    ...(dto.imageContent && dto.imageMimeType
      ? {
          imageUrl: `data:${dto.imageMimeType};base64,${dto.imageContent}`,
        }
      : {}),
    updatedAt: new Date(),
  };
}
