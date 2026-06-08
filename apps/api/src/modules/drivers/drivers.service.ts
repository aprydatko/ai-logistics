import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import {
  drivers,
  driverActivity,
  driverDocuments,
  driverVehicleAssignments,
  type DriverRecord,
  loads,
  type LoadRecord,
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
  DriverListItem,
  DriverTrip,
  DriversListResponse,
  UpdateDriverResponse,
  UpsertDriverVehicleResponse,
} from "./drivers.types";

@Injectable()
export class DriversService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateDriverDto): Promise<CreateDriverResponse> {
    try {
      const [driver] = await this.databaseService.client
        .insert(drivers)
        .values({
          ...dto,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email.trim().toLowerCase(),
          driverCode: dto.driverCode.trim().toUpperCase(),
          phone: dto.phone.trim(),
          address: dto.address?.trim() || null,
          emergencyContact: dto.emergencyContact?.trim() || null,
          emergencyPhone: dto.emergencyPhone?.trim() || null,
          licenseNumber: dto.licenseNumber.trim(),
          licenseState: dto.licenseState.trim(),
          licenseType: dto.licenseType.trim(),
          notes: dto.notes?.trim() || null,
          truckNumber: dto.truckNumber?.trim() || null,
          trailerNumber: dto.trailerNumber?.trim() || null,
        })
        .returning();

      if (!driver) {
        throw new InternalServerErrorException("Failed to create driver");
      }

      return { success: true, data: this.toDriver(driver) };
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          "Driver ID, email, truck number, or trailer number already exists",
        );
      }

      throw error;
    }
  }

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

  async findAll(query: ListDriversQueryDto): Promise<DriversListResponse> {
    const filters = this.buildFilters(query);
    const where = filters.length > 0 ? and(...filters) : undefined;
    const [rows, countRows] = await Promise.all([
      this.databaseService.client
        .select()
        .from(drivers)
        .where(where)
        .orderBy(asc(drivers.lastName), asc(drivers.firstName))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.databaseService.client
        .select({ total: count() })
        .from(drivers)
        .where(where),
    ]);
    const total = countRows[0]?.total ?? 0;

    return {
      success: true,
      data: rows.map((driver) => this.toDriver(driver)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findById(id: string): Promise<DriverDetailsResponse> {
    const [driver] = await this.databaseService.client
      .select()
      .from(drivers)
      .where(eq(drivers.id, id))
      .limit(1);

    if (!driver) {
      throw new NotFoundException("Driver was not found");
    }

    const [tripsHistory, documents, activity, vehicleRows] = await Promise.all([
      this.databaseService.client
        .select()
        .from(loads)
        .where(eq(loads.driverId, id))
        .orderBy(desc(loads.pickupDate), desc(loads.createdAt)),
      this.databaseService.client
        .select()
        .from(driverDocuments)
        .where(eq(driverDocuments.driverId, id))
        .orderBy(
          desc(driverDocuments.expiresAt),
          desc(driverDocuments.createdAt),
        ),
      this.databaseService.client
        .select()
        .from(driverActivity)
        .where(eq(driverActivity.driverId, id))
        .orderBy(desc(driverActivity.createdAt))
        .limit(20),
      this.databaseService.client
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
        ...this.toDriver(driver),
        currentVehicle: currentVehicle
          ? {
              ...currentVehicle.vehicle,
              assignedAt: currentVehicle.assignedAt.toISOString(),
              createdAt: currentVehicle.vehicle.createdAt.toISOString(),
              updatedAt: currentVehicle.vehicle.updatedAt.toISOString(),
            }
          : null,
        documents: documents.map((document) => ({
          ...document,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
        })),
        tripsHistory: tripsHistory.map((trip) => this.toDriverTrip(trip)),
        activity: activity.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        })),
      },
    };
  }

  async update(
    id: string,
    dto: UpdateDriverDto,
  ): Promise<UpdateDriverResponse> {
    const hasUpdates = Object.values(dto).some((value) => value !== undefined);

    if (!hasUpdates) {
      throw new BadRequestException("At least one field must be provided");
    }

    if (dto.userId) {
      await this.assertDriverUser(dto.userId);
    }

    try {
      const [driver] = await this.databaseService.client
        .update(drivers)
        .set({
          ...dto,
          updatedAt: new Date(),
        })
        .where(eq(drivers.id, id))
        .returning();

      if (!driver) {
        throw new NotFoundException("Driver was not found");
      }

      return { success: true, data: this.toDriver(driver) };
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          "Driver, truck number, or trailer number already exists",
        );
      }

      throw error;
    }
  }

  async addDocument(
    driverId: string,
    dto: CreateDriverDocumentDto,
  ): Promise<CreateDriverDocumentResponse> {
    await this.assertDriverExists(driverId);
    const fileSize = Buffer.byteLength(dto.content, "base64");

    if (fileSize > 5 * 1024 * 1024) {
      throw new BadRequestException("Document must be 5 MB or smaller");
    }

    const [document] = await this.databaseService.client
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

    if (!document) {
      throw new InternalServerErrorException("Failed to save document");
    }

    await this.databaseService.client.insert(driverActivity).values({
      driverId,
      type: "document_added",
      description: `Document "${document.name}" was added`,
      metadata: { documentId: document.id, documentType: document.type },
    });

    return {
      success: true,
      data: {
        ...document,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      },
    };
  }

  async removeDocument(
    driverId: string,
    documentId: string,
  ): Promise<DeleteDriverDocumentResponse> {
    const [document] = await this.databaseService.client
      .delete(driverDocuments)
      .where(
        and(
          eq(driverDocuments.id, documentId),
          eq(driverDocuments.driverId, driverId),
        ),
      )
      .returning({ id: driverDocuments.id });

    if (!document) {
      throw new NotFoundException("Document was not found");
    }

    return { success: true, message: "Document deleted" };
  }

  async upsertVehicle(
    driverId: string,
    dto: UpsertDriverVehicleDto,
  ): Promise<UpsertDriverVehicleResponse> {
    await this.assertDriverExists(driverId);

    if (dto.imageContent) {
      const imageSize = Buffer.byteLength(dto.imageContent, "base64");
      if (imageSize > 2 * 1024 * 1024) {
        throw new BadRequestException("Truck image must be 2 MB or smaller");
      }
    }

    try {
      return await this.databaseService.client.transaction(async (tx) => {
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
        const vehicleValues = {
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
          data: {
            ...vehicle,
            assignedAt: assignedAt.toISOString(),
            createdAt: vehicle.createdAt.toISOString(),
            updatedAt: vehicle.updatedAt.toISOString(),
          },
        };
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          "Truck number or VIN is already assigned to another vehicle",
        );
      }
      throw error;
    }
  }

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

  private buildFilters(query: ListDriversQueryDto): SQL[] {
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

  private toDriver(driver: DriverRecord): DriverListItem {
    return {
      ...driver,
      currentLocation: driver.currentLocation ?? undefined,
      rating: Number(driver.rating),
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
    };
  }

  private toDriverTrip(load: LoadRecord): DriverTrip {
    return {
      ...load,
      pickupDate: load.pickupDate.toISOString(),
      deliveryDate: load.deliveryDate.toISOString(),
      price: Number(load.price),
      createdAt: load.createdAt.toISOString(),
      updatedAt: load.updatedAt.toISOString(),
    };
  }

  private async assertDriverUser(userId: string): Promise<void> {
    const [user] = await this.databaseService.client
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.role !== "driver") {
      throw new BadRequestException("Driver user was not found");
    }
  }

  private async assertDriverExists(driverId: string): Promise<void> {
    const [driver] = await this.databaseService.client
      .select({ id: drivers.id })
      .from(drivers)
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (!driver) {
      throw new NotFoundException("Driver was not found");
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }
}
