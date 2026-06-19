import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import {
  documents,
  drivers,
  driverActivity,
  driverDocuments,
  driverVehicleAssignments,
  loads,
  users,
  vehicles,
} from "../../db/schema";
import type { CreateDriverDto } from "./dto/create-driver.dto";
import type { CreateDriverDocumentDto } from "./dto/create-driver-document.dto";
import type { ListDriversQueryDto } from "./dto/list-drivers-query.dto";
import type { UpdateDriverDto } from "./dto/update-driver.dto";
import type { UpsertDriverVehicleDto } from "./dto/upsert-driver-vehicle.dto";
import type {
  CreateDriverResponse,
  CreateDriverDocumentResponse,
  DeleteDriverDocumentResponse,
  DeleteDriverResponse,
  DriverDetailsResponse,
  DriverCandidatesResponse,
  DriversListResponse,
  UpdateDriverResponse,
  UpsertDriverVehicleResponse,
} from "./drivers.types";
import { assertDriverDocumentSize } from "./internal/driver-document";
import { isPostgresUniqueViolation } from "./internal/driver.errors";
import {
  normalizeCreateDriverValues,
  toDriverActivityItem,
  toDriverDocumentItem,
  toDriverListItem,
  toDriverTrip,
  toDriverVehicleItem,
} from "./internal/driver.mapper";
import { buildDriverFilters } from "./internal/driver.query";
import {
  assertDriverExists,
  assertDriverUser,
} from "./internal/driver.relations";
import { getUpdatedDriverFields } from "./internal/driver.update";
import {
  assertTruckImageSize,
  buildVehicleValues,
} from "./internal/driver-vehicle";
import { CacheService } from "../cache/cache.service";
import { buildCacheKey } from "../cache/cache.utils";

@Injectable()
export class DriversService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Creates a new driver profile with an initial activity log entry.
   *
   * Normalizes string fields (trim, lowercase email, uppercase driverCode),
   * inserts the driver record and a "created" activity event inside a single
   * transaction. Throws ConflictException if a unique constraint is violated
   * (duplicate driver code, email, truck number, or trailer number).
   *
   * @param dto - Driver creation payload
   * @returns Created driver mapped to the list-item shape
   * @throws ConflictException if any unique field already exists
   */
  async create(dto: CreateDriverDto): Promise<CreateDriverResponse> {
    const client = this.databaseService.client;

    try {
      const driver = await client.transaction(async (tx) => {
        const [savedDriver] = await tx
          .insert(drivers)
          .values(normalizeCreateDriverValues(dto))
          .returning();

        if (!savedDriver) {
          throw new InternalServerErrorException("Failed to create driver");
        }

        await tx.insert(driverActivity).values({
          driverId: savedDriver.id,
          type: "created",
          description: `Driver ${savedDriver.firstName} ${savedDriver.lastName} was created`,
          metadata: {
            driverCode: savedDriver.driverCode,
            status: savedDriver.status,
          },
        });

        return savedDriver;
      });

      if (!driver) {
        throw new InternalServerErrorException("Failed to create driver");
      }

      await this.invalidateDriverReadCaches();
      return { success: true, data: toDriverListItem(driver) };
    } catch (error: unknown) {
      if (isPostgresUniqueViolation(error)) {
        throw new ConflictException(
          "Driver ID, email, truck number, or trailer number already exists",
        );
      }

      throw error;
    }
  }

  /**
   * Returns users eligible to be linked to a new driver profile.
   *
   * A candidate is a user with the "driver" role, active account, and no
   * existing driver record. Results are ordered alphabetically by last name
   * then first name.
   *
   * @returns List of candidate users (id, firstName, lastName, email)
   */
  async findCandidates(): Promise<DriverCandidatesResponse> {
    const candidates = await this.databaseService.client
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .leftJoin(drivers, eq(drivers.userId, users.id))
      .where(
        and(
          eq(users.role, "driver"),
          eq(users.isActive, true),
          isNull(drivers.id),
        ),
      )
      .orderBy(asc(users.lastName), asc(users.firstName));

    return { success: true, data: candidates };
  }

  /**
   * Returns a paginated, filtered list of drivers.
   *
   * Executes data and count queries in parallel. Supported filters:
   * free-text search across code, name, phone, truck/trailer numbers;
   * `isActive`, `status`, `truckNumber`, `trailerNumber`.
   *
   * @param query - Pagination, search, and filter parameters
   * @returns Paginated driver list with total count and page metadata
   */
  async findAll(query: ListDriversQueryDto): Promise<DriversListResponse> {
    return this.cacheService.getOrSet(
      "drivers",
      buildCacheKey("drivers", "find-all", query),
      this.cacheService.getTtl("list"),
      async () => {
        const filters = buildDriverFilters(query);
        const where = filters.length > 0 ? and(...filters) : undefined;
        const client = this.databaseService.client;
        const [rows, countRows] = await Promise.all([
          client
            .select()
            .from(drivers)
            .where(where)
            .orderBy(asc(drivers.lastName), asc(drivers.firstName))
            .limit(query.limit)
            .offset((query.page - 1) * query.limit),
          client.select({ total: count() }).from(drivers).where(where),
        ]);
        const total = countRows[0]?.total ?? 0;

        return {
          success: true,
          data: rows.map(toDriverListItem),
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
          },
        };
      },
    );
  }

  /**
   * Returns full details for a single driver including related data.
   *
   * After fetching the driver record, executes four queries in parallel:
   * trips history (loads), driver documents, activity log (last 20 entries),
   * and the currently active primary vehicle assignment.
   *
   * @param id - Driver UUID
   * @returns Driver details with vehicle, documents, trips, and activity
   * @throws NotFoundException if the driver does not exist
   */
  async findById(id: string): Promise<DriverDetailsResponse> {
    return this.cacheService.getOrSet(
      "drivers",
      buildCacheKey("drivers", "find-by-id", { id }),
      this.cacheService.getTtl("detail"),
      async () => {
        const client = this.databaseService.client;
        const [driver] = await client
          .select()
          .from(drivers)
          .where(eq(drivers.id, id))
          .limit(1);

        if (!driver) {
          throw new NotFoundException("Driver was not found");
        }

        const [tripsHistory, driverDocumentRows, activity, vehicleRows] =
          await Promise.all([
            client
              .select()
              .from(loads)
              .where(eq(loads.driverId, id))
              .orderBy(desc(loads.pickupDate), desc(loads.createdAt)),
            client
              .select()
              .from(driverDocuments)
              .where(eq(driverDocuments.driverId, id))
              .orderBy(
                desc(driverDocuments.expiresAt),
                desc(driverDocuments.createdAt),
              ),
            client
              .select()
              .from(driverActivity)
              .where(eq(driverActivity.driverId, id))
              .orderBy(desc(driverActivity.createdAt))
              .limit(20),
            client
              .select({
                vehicle: vehicles,
                assignedAt: driverVehicleAssignments.assignedAt,
              })
              .from(driverVehicleAssignments)
              .innerJoin(
                vehicles,
                eq(driverVehicleAssignments.vehicleId, vehicles.id),
              )
              .where(
                and(
                  eq(driverVehicleAssignments.driverId, id),
                  isNull(driverVehicleAssignments.unassignedAt),
                  eq(driverVehicleAssignments.isPrimary, true),
                ),
              )
              .orderBy(desc(driverVehicleAssignments.assignedAt))
              .limit(1),
          ]);
        const currentVehicle = vehicleRows[0];

        return {
          success: true,
          data: {
            ...toDriverListItem(driver),
            currentVehicle: currentVehicle
              ? toDriverVehicleItem(
                  currentVehicle.vehicle,
                  currentVehicle.assignedAt,
                )
              : null,
            documents: driverDocumentRows.map(toDriverDocumentItem),
            tripsHistory: tripsHistory.map(toDriverTrip),
            activity: activity.map(toDriverActivityItem),
          },
        };
      },
    );
  }

  /**
   * Partially updates a driver profile and logs the change as an activity event.
   *
   * Requires at least one field to be present in the payload. If `userId` is
   * provided, validates that the user exists and has the "driver" role.
   * The update and activity insert run inside a transaction. A status change
   * produces a `status_changed` event; any other field update produces an
   * `updated` event listing the changed fields by human-readable label.
   * Throws ConflictException on unique constraint violations.
   *
   * @param id - Driver UUID
   * @param dto - Partial update payload (at least one field required)
   * @returns Updated driver mapped to the list-item shape
   * @throws BadRequestException if no fields are provided
   * @throws NotFoundException if the driver does not exist
   * @throws ConflictException if a unique field conflicts with another record
   */
  async update(
    id: string,
    dto: UpdateDriverDto,
  ): Promise<UpdateDriverResponse> {
    const hasUpdates = Object.values(dto).some((value) => value !== undefined);

    if (!hasUpdates) {
      throw new BadRequestException("At least one field must be provided");
    }

    const client = this.databaseService.client;
    if (dto.userId) {
      await assertDriverUser(client, dto.userId);
    }

    try {
      const driver = await client.transaction(async (tx) => {
        const [currentDriver] = await tx
          .select()
          .from(drivers)
          .where(eq(drivers.id, id))
          .limit(1);

        if (!currentDriver) {
          throw new NotFoundException("Driver was not found");
        }

        const [updatedDriver] = await tx
          .update(drivers)
          .set({
            ...dto,
            updatedAt: new Date(),
          })
          .where(eq(drivers.id, id))
          .returning();

        if (!updatedDriver) {
          throw new NotFoundException("Driver was not found");
        }

        const statusChanged =
          dto.status !== undefined && dto.status !== currentDriver.status;
        const changedFields = getUpdatedDriverFields(dto);

        if (statusChanged) {
          await tx.insert(driverActivity).values({
            driverId: updatedDriver.id,
            type: "status_changed",
            description: `Status changed from ${currentDriver.status.replaceAll("_", " ")} to ${updatedDriver.status.replaceAll("_", " ")}`,
            metadata: {
              from: currentDriver.status,
              to: updatedDriver.status,
            },
          });
        } else if (changedFields.length > 0) {
          await tx.insert(driverActivity).values({
            driverId: updatedDriver.id,
            type: "updated",
            description: `Driver profile was updated: ${changedFields.join(", ")}`,
            metadata: { fields: changedFields },
          });
        }

        return updatedDriver;
      });

      if (!driver) {
        throw new NotFoundException("Driver was not found");
      }

      await this.invalidateDriverReadCaches();
      return { success: true, data: toDriverListItem(driver) };
    } catch (error: unknown) {
      if (isPostgresUniqueViolation(error)) {
        throw new ConflictException(
          "Driver, truck number, or trailer number already exists",
        );
      }

      throw error;
    }
  }

  /**
   * Attaches a base64-encoded document to a driver profile.
   *
   * Validates driver existence and file size (max 5 MB decoded). Inside a
   * transaction: inserts a `driverDocuments` record, mirrors it to the shared
   * `documents` table (type `driver_license`, status `complete`), and logs a
   * `document_added` activity event.
   *
   * @param driverId - Driver UUID
   * @param dto - Document payload including base64 content, type, and metadata
   * @param uploadedByUserId - ID of the authenticated user performing the upload
   * @returns Newly created driver document record
   * @throws NotFoundException if the driver does not exist
   * @throws BadRequestException if the decoded file exceeds the size limit
   */
  async addDocument(
    driverId: string,
    dto: CreateDriverDocumentDto,
    uploadedByUserId: string,
  ): Promise<CreateDriverDocumentResponse> {
    const client = this.databaseService.client;
    await assertDriverExists(client, driverId);
    const fileSize = assertDriverDocumentSize(dto.content);

    const document = await client.transaction(async (tx) => {
      const [savedDocument] = await tx
        .insert(driverDocuments)
        .values({
          driverId,
          type: dto.type,
          name: dto.name.trim(),
          documentNumber: dto.documentNumber?.trim() || null,
          fileUrl: `data:${dto.mimeType};base64,${dto.content}`,
          mimeType: dto.mimeType,
          fileSize,
          issuedAt: dto.issuedAt,
          expiresAt: dto.expiresAt,
        })
        .returning();

      if (!savedDocument) {
        throw new InternalServerErrorException("Failed to save document");
      }

      await tx.insert(documents).values({
        id: savedDocument.id,
        fileName: savedDocument.name,
        fileSize,
        mimeType: savedDocument.mimeType,
        type: "driver_license",
        status: "complete",
        uploadedByUserId,
        driverId,
        uploadedAt: savedDocument.createdAt,
      });

      await tx.insert(driverActivity).values({
        driverId,
        type: "document_added",
        description: `Document "${savedDocument.name}" was added`,
        metadata: {
          documentId: savedDocument.id,
          documentType: savedDocument.type,
        },
      });

      return savedDocument;
    });

    await this.invalidateDriverReadCaches();
    return {
      success: true,
      data: toDriverDocumentItem(document),
    };
  }

  /**
   * Removes a driver document and its shared-documents mirror record.
   *
   * All operations run in a transaction: selects the document for its name/type
   * (for the activity log), deletes it from `driverDocuments`, removes the
   * corresponding row from `documents`, and inserts an activity event. The
   * NotFoundException is thrown outside the transaction after it commits.
   *
   * @param driverId - Driver UUID (used to scope the deletion)
   * @param documentId - Document UUID to delete
   * @returns Success confirmation message
   * @throws NotFoundException if the document does not exist for this driver
   */
  async removeDocument(
    driverId: string,
    documentId: string,
  ): Promise<DeleteDriverDocumentResponse> {
    const document = await this.databaseService.client.transaction(
      async (tx) => {
        const [existingDocument] = await tx
          .select({
            id: driverDocuments.id,
            name: driverDocuments.name,
            type: driverDocuments.type,
          })
          .from(driverDocuments)
          .where(
            and(
              eq(driverDocuments.id, documentId),
              eq(driverDocuments.driverId, driverId),
            ),
          )
          .limit(1);

        const [deletedDocument] = await tx
          .delete(driverDocuments)
          .where(
            and(
              eq(driverDocuments.id, documentId),
              eq(driverDocuments.driverId, driverId),
            ),
          )
          .returning({ id: driverDocuments.id });

        if (deletedDocument) {
          await tx.delete(documents).where(eq(documents.id, documentId));
          await tx.insert(driverActivity).values({
            driverId,
            type: "updated",
            description: `Document "${existingDocument?.name ?? "Unknown document"}" was removed`,
            metadata: {
              documentId,
              documentType: existingDocument?.type ?? null,
            },
          });
        }

        return deletedDocument;
      },
    );

    if (!document) {
      throw new NotFoundException("Document was not found");
    }

    await this.invalidateDriverReadCaches();
    return { success: true, message: "Document deleted" };
  }

  /**
   * Creates or updates the primary vehicle assignment for a driver.
   *
   * Validates driver existence and truck image size (max 2 MB). Inside a
   * transaction: checks for an existing active primary assignment.
   * - **Existing assignment:** updates the vehicle record in place.
   * - **No assignment:** inserts a new vehicle and creates an assignment record.
   * In both cases syncs `drivers.truckNumber` and logs an activity event
   * (`vehicle_assigned` or `updated`). Throws ConflictException on duplicate
   * unit number or VIN.
   *
   * @param driverId - Driver UUID
   * @param dto - Vehicle payload including unit number, type, and optional image
   * @returns Updated or newly assigned vehicle with assignment timestamp
   * @throws NotFoundException if the driver does not exist
   * @throws BadRequestException if the truck image exceeds the size limit
   * @throws ConflictException if the unit number or VIN already exists
   */
  async upsertVehicle(
    driverId: string,
    dto: UpsertDriverVehicleDto,
  ): Promise<UpsertDriverVehicleResponse> {
    const client = this.databaseService.client;
    await assertDriverExists(client, driverId);
    assertTruckImageSize(dto);

    try {
      const result: UpsertDriverVehicleResponse = await client.transaction(
        async (tx) => {
          const [assignment] = await tx
          .select({
            vehicleId: driverVehicleAssignments.vehicleId,
            assignedAt: driverVehicleAssignments.assignedAt,
          })
          .from(driverVehicleAssignments)
          .where(
            and(
              eq(driverVehicleAssignments.driverId, driverId),
              isNull(driverVehicleAssignments.unassignedAt),
              eq(driverVehicleAssignments.isPrimary, true),
            ),
          )
          .limit(1);
        const vehicleValues = buildVehicleValues(dto);
        let vehicle;
        const assignedAt = assignment?.assignedAt ?? new Date();

        if (assignment) {
          [vehicle] = await tx
            .update(vehicles)
            .set(vehicleValues)
            .where(eq(vehicles.id, assignment.vehicleId))
            .returning();
        } else {
          [vehicle] = await tx
            .insert(vehicles)
            .values(vehicleValues)
            .returning();

          if (vehicle) {
            await tx.insert(driverVehicleAssignments).values({
              driverId,
              vehicleId: vehicle.id,
              assignedAt,
              isPrimary: true,
            });
          }
        }

        if (!vehicle) {
          throw new InternalServerErrorException("Failed to save truck");
        }

        await tx
          .update(drivers)
          .set({ truckNumber: vehicle.unitNumber, updatedAt: new Date() })
          .where(eq(drivers.id, driverId));
        await tx.insert(driverActivity).values({
          driverId,
          type: assignment ? "updated" : "vehicle_assigned",
          description: assignment
            ? `Truck ${vehicle.unitNumber} was updated`
            : `Truck ${vehicle.unitNumber} was assigned`,
          metadata: { vehicleId: vehicle.id },
        });

        return {
          success: true,
          data: toDriverVehicleItem(vehicle, assignedAt),
        };
        },
      );
      await this.invalidateDriverReadCaches();
      return result;
    } catch (error: unknown) {
      if (isPostgresUniqueViolation(error)) {
        throw new ConflictException(
          "Truck number or VIN is already assigned to another vehicle",
        );
      }
      throw error;
    }
  }

  /**
   * Permanently deletes a driver record.
   *
   * Note: related records (documents, activity, vehicle assignments) are
   * removed via database cascade constraints. The physical files stored in
   * the shared `documents` table are not deleted from storage.
   *
   * @param id - Driver UUID
   * @returns Success confirmation message
   * @throws NotFoundException if the driver does not exist
   */
  async remove(id: string): Promise<DeleteDriverResponse> {
    const [driver] = await this.databaseService.client
      .delete(drivers)
      .where(eq(drivers.id, id))
      .returning({ id: drivers.id });

    if (!driver) {
      throw new NotFoundException("Driver was not found");
    }

    return {
      success: true,
      message: "Driver deleted",
    };
  }

  private async invalidateDriverReadCaches(): Promise<void> {
    await Promise.all([
      this.cacheService.invalidateNamespace("drivers"),
      this.cacheService.invalidateNamespace("loads"),
      this.cacheService.invalidateNamespace("documents"),
      this.cacheService.invalidateNamespace("incidents"),
    ]);
  }
}
