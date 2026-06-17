import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { and, count, desc, eq, inArray, ne } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import { drivers, driverActivity, loads } from "../../db/schema";
import type { AssignLoadDriverDto } from "./dto/assign-load-driver.dto";
import type { CreateLoadDto } from "./dto/create-load.dto";
import type { ListLoadsQueryDto } from "./dto/list-loads-query.dto";
import type { UpdateLoadDto } from "./dto/update-load.dto";
import type {
  AssignLoadDriverResponse,
  CreateLoadResponse,
  LoadResponse,
  LoadsListResponse,
  UpdateLoadResponse,
} from "./loads.types";
import { calculateLoadEta } from "./load-eta";
import { isPostgresUniqueViolation } from "./internal/load.errors";
import {
  toCreateLoadValues,
  toLoadItem,
  toLoadListItem,
} from "./internal/load.mapper";
import { buildLoadFilters, loadListSelect } from "./internal/load.query";
import {
  assertLoadDriverExists,
  findLoadDriverSummary,
} from "./internal/load.relations";
import {
  assertLoadDateOrder,
  assertUpdatedLoadDateOrder,
} from "./internal/load.validation";

@Injectable()
export class LoadsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Returns a paginated, filtered list of loads with their assigned driver summaries.
   *
   * Executes data and count queries in parallel using `Promise.all`. The data
   * query performs a LEFT JOIN with drivers to include driver summary fields.
   * Loads are ordered by pickup date descending, then creation date descending.
   * Supported filters: free-text search (referenceNumber, pickupAddress,
   * deliveryAddress), `status`, `driverId`, `pickupFrom`, `pickupTo`.
   *
   * @param query - Pagination, search, and filter parameters
   * @returns Paginated load list with driver summaries and page metadata
   */
  async findAll(query: ListLoadsQueryDto): Promise<LoadsListResponse> {
    const filters = buildLoadFilters(query);
    const where = filters.length > 0 ? and(...filters) : undefined;
    const client = this.databaseService.client;
    const [rows, countRows] = await Promise.all([
      loadListSelect(client)
        .where(where)
        .orderBy(desc(loads.pickupDate), desc(loads.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      client.select({ total: count() }).from(loads).where(where),
    ]);
    const total = countRows[0]?.total ?? 0;

    return {
      success: true,
      data: rows.map(toLoadListItem),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findById(id: string): Promise<LoadResponse> {
    const client = this.databaseService.client;
    const [load] = await client
      .select()
      .from(loads)
      .where(eq(loads.id, id))
      .limit(1);

    if (!load) {
      throw new NotFoundException("Load was not found");
    }

    const driver = load.driverId
      ? await findLoadDriverSummary(client, load.driverId)
      : null;

    return {
      success: true,
      data: toLoadItem(load, driver),
    };
  }

  /**
   * Creates a new load record.
   *
   * Validates that pickupDate is on or before deliveryDate, and optionally
   * asserts that the given driverId references an existing active driver.
   * Normalizes string fields (trims whitespace, uppercases referenceNumber,
   * converts price to string). Returns the created load with `driver: null`
   * since driver assignment is a separate operation.
   *
   * @param dto - Load creation payload
   * @returns Created load with no driver attached
   * @throws BadRequestException if deliveryDate precedes pickupDate
   * @throws BadRequestException if the given driverId does not exist
   * @throws ConflictException if the referenceNumber is already in use
   */
  async create(dto: CreateLoadDto): Promise<CreateLoadResponse> {
    assertLoadDateOrder(dto.pickupDate, dto.deliveryDate);

    const client = this.databaseService.client;
    if (dto.driverId) await assertLoadDriverExists(client, dto.driverId);

    try {
      const [load] = await client
        .insert(loads)
        .values(toCreateLoadValues(dto))
        .returning();

      if (!load) {
        throw new InternalServerErrorException("Failed to create load");
      }

      return { success: true, data: toLoadItem(load, null) };
    } catch (error: unknown) {
      if (isPostgresUniqueViolation(error)) {
        throw new ConflictException("Load reference number already exists");
      }
      throw error;
    }
  }

  /**
   * Assigns an available driver to a load and calculates the estimated delivery date.
   *
   * All validations and mutations run in a single transaction:
   * 1. Verifies the load exists and is not already delivered or cancelled.
   * 2. Verifies the driver exists, is active, has "available" status, and has
   *    a truck assigned.
   * 3. Checks that the driver has no other active load (status `assigned` or
   *    `in_transit`).
   * 4. Computes the ETA using `calculateLoadEta` based on miles and average speed,
   *    accounting for mandatory rest breaks between driving shifts.
   * 5. Updates the load status to `assigned` and sets the computed delivery date.
   * 6. Logs a `trip_assigned` driver activity event.
   *
   * @param id - Load UUID
   * @param dto - Assignment payload with driverId and averageSpeedMph
   * @returns Updated load with the assigned driver summary
   * @throws NotFoundException if the load or driver does not exist
   * @throws BadRequestException if the load status is `delivered` or `cancelled`,
   *   or if the driver has no assigned truck
   * @throws ConflictException if the driver is unavailable or already has an active load
   */
  async assignDriver(
    id: string,
    dto: AssignLoadDriverDto,
  ): Promise<AssignLoadDriverResponse> {
    return this.databaseService.client.transaction(async (tx) => {
      const [load] = await tx
        .select()
        .from(loads)
        .where(eq(loads.id, id))
        .limit(1);

      if (!load) throw new NotFoundException("Load was not found");
      if (load.status === "delivered" || load.status === "cancelled") {
        throw new BadRequestException(
          "A delivered or cancelled load cannot be assigned",
        );
      }

      const [driver] = await tx
        .select({
          id: drivers.id,
          firstName: drivers.firstName,
          lastName: drivers.lastName,
          isActive: drivers.isActive,
          status: drivers.status,
          truckNumber: drivers.truckNumber,
        })
        .from(drivers)
        .where(eq(drivers.id, dto.driverId))
        .limit(1);

      if (!driver) throw new NotFoundException("Driver was not found");
      if (!driver.isActive || driver.status !== "available") {
        throw new ConflictException("Driver is not available");
      }
      if (!driver.truckNumber) {
        throw new BadRequestException("Driver must have an assigned truck");
      }

      const [activeLoad] = await tx
        .select({ id: loads.id })
        .from(loads)
        .where(
          and(
            eq(loads.driverId, dto.driverId),
            inArray(loads.status, ["assigned", "in_transit"]),
            ne(loads.id, id),
          ),
        )
        .limit(1);

      if (activeLoad) {
        throw new ConflictException(
          "Driver already has an active load assignment",
        );
      }

      const deliveryDate = calculateLoadEta({
        averageSpeedMph: dto.averageSpeedMph,
        miles: load.miles,
        pickupDate: load.pickupDate,
      });
      const [assignedLoad] = await tx
        .update(loads)
        .set({
          driverId: driver.id,
          deliveryDate,
          status: "assigned",
          updatedAt: new Date(),
        })
        .where(eq(loads.id, id))
        .returning();

      if (!assignedLoad) {
        throw new InternalServerErrorException("Failed to assign driver");
      }

      await tx.insert(driverActivity).values({
        driverId: driver.id,
        type: "trip_assigned",
        description: `Load ${load.referenceNumber} was assigned`,
        metadata: {
          loadId: load.id,
          averageSpeedMph: dto.averageSpeedMph,
          estimatedDeliveryAt: deliveryDate.toISOString(),
        },
      });

      return {
        success: true,
        data: toLoadItem(assignedLoad, {
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          avatarUrl: null,
          truckNumber: driver.truckNumber,
        }),
      };
    });
  }

  /**
   * Partially updates a load record and optionally logs a driver activity event.
   *
   * Requires at least one field. Validates driver existence if `driverId` is
   * provided, and re-validates the pickup/delivery date order taking the
   * current persisted dates into account. The update runs in a transaction;
   * if the load status changes and the load has an assigned driver, a
   * `trip_completed` or `status_changed` driver activity event is inserted.
   * After the transaction, a driver summary is fetched separately if the
   * load has an assigned driver.
   *
   * @param id - Load UUID
   * @param dto - Partial update payload (at least one field required)
   * @returns Updated load with driver summary if one is assigned
   * @throws BadRequestException if no fields are provided, or if date order is invalid
   * @throws NotFoundException if the load does not exist
   * @throws ConflictException if the referenceNumber conflicts with another load
   */
  async update(id: string, dto: UpdateLoadDto): Promise<UpdateLoadResponse> {
    if (!Object.values(dto).some((value) => value !== undefined)) {
      throw new BadRequestException("At least one field must be provided");
    }

    const client = this.databaseService.client;
    if (dto.driverId) await assertLoadDriverExists(client, dto.driverId);
    await assertUpdatedLoadDateOrder(client, id, dto);

    try {
      const load = await client.transaction(async (tx) => {
        const [currentLoad] = await tx
          .select()
          .from(loads)
          .where(eq(loads.id, id))
          .limit(1);

        if (!currentLoad) throw new NotFoundException("Load was not found");

        const [updatedLoad] = await tx
          .update(loads)
          .set({
            ...dto,
            referenceNumber: dto.referenceNumber?.trim().toUpperCase(),
            pickupAddress: dto.pickupAddress?.trim(),
            deliveryAddress: dto.deliveryAddress?.trim(),
            pickupDate: dto.pickupDate ? new Date(dto.pickupDate) : undefined,
            deliveryDate: dto.deliveryDate
              ? new Date(dto.deliveryDate)
              : undefined,
            price: dto.price === undefined ? undefined : String(dto.price),
            notes: dto.notes?.trim() || (dto.notes === "" ? null : undefined),
            updatedAt: new Date(),
          })
          .where(eq(loads.id, id))
          .returning();

        if (!updatedLoad) throw new NotFoundException("Load was not found");

        if (
          updatedLoad.driverId &&
          dto.status !== undefined &&
          dto.status !== currentLoad.status
        ) {
          await tx.insert(driverActivity).values({
            driverId: updatedLoad.driverId,
            type:
              dto.status === "delivered" ? "trip_completed" : "status_changed",
            description:
              dto.status === "delivered"
                ? `Completed load ${updatedLoad.referenceNumber}`
                : `Load ${updatedLoad.referenceNumber} status changed to ${updatedLoad.status.replaceAll("_", " ")}`,
            metadata: {
              loadId: updatedLoad.id,
              from: currentLoad.status,
              to: updatedLoad.status,
            },
          });
        }

        return updatedLoad;
      });

      if (!load) throw new NotFoundException("Load was not found");
      const driver = load.driverId
        ? await findLoadDriverSummary(client, load.driverId)
        : null;
      return { success: true, data: toLoadItem(load, driver) };
    } catch (error: unknown) {
      if (isPostgresUniqueViolation(error)) {
        throw new ConflictException("Load reference number already exists");
      }
      throw error;
    }
  }
}
