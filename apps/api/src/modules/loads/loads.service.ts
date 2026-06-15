import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  or,
  type SQL,
} from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import {
  drivers,
  driverActivity,
  loads,
  type LoadRecord,
} from "../../db/schema";
import type { AssignLoadDriverDto } from "./dto/assign-load-driver.dto";
import type { CreateLoadDto } from "./dto/create-load.dto";
import type { ListLoadsQueryDto } from "./dto/list-loads-query.dto";
import type { UpdateLoadDto } from "./dto/update-load.dto";
import type {
  AssignLoadDriverResponse,
  CreateLoadResponse,
  LoadItem,
  LoadsListResponse,
  UpdateLoadResponse,
} from "./loads.types";
import { calculateLoadEta } from "./load-eta";

@Injectable()
export class LoadsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query: ListLoadsQueryDto): Promise<LoadsListResponse> {
    const filters = this.buildFilters(query);
    const where = filters.length > 0 ? and(...filters) : undefined;
    const [rows, countRows] = await Promise.all([
      this.databaseService.client
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
        .leftJoin(drivers, eq(loads.driverId, drivers.id))
        .where(where)
        .orderBy(desc(loads.pickupDate), desc(loads.createdAt))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.databaseService.client
        .select({ total: count() })
        .from(loads)
        .where(where),
    ]);
    const total = countRows[0]?.total ?? 0;

    return {
      success: true,
      data: rows.map(({ load, driver }) =>
        this.toLoad(load, driver?.id ? driver : null),
      ),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async create(dto: CreateLoadDto): Promise<CreateLoadResponse> {
    this.assertDateOrder(dto.pickupDate, dto.deliveryDate);
    if (dto.driverId) await this.assertDriverExists(dto.driverId);

    try {
      const [load] = await this.databaseService.client
        .insert(loads)
        .values(this.toCreateValues(dto))
        .returning();

      if (!load) {
        throw new InternalServerErrorException("Failed to create load");
      }

      return { success: true, data: this.toLoad(load, null) };
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Load reference number already exists");
      }
      throw error;
    }
  }

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
        data: this.toLoad(assignedLoad, {
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          avatarUrl: null,
          truckNumber: driver.truckNumber,
        }),
      };
    });
  }

  async update(id: string, dto: UpdateLoadDto): Promise<UpdateLoadResponse> {
    if (!Object.values(dto).some((value) => value !== undefined)) {
      throw new BadRequestException("At least one field must be provided");
    }

    if (dto.driverId) await this.assertDriverExists(dto.driverId);
    await this.assertUpdatedDateOrder(id, dto);

    try {
      const load = await this.databaseService.client.transaction(async (tx) => {
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
        ? await this.findDriverSummary(load.driverId)
        : null;
      return { success: true, data: this.toLoad(load, driver) };
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Load reference number already exists");
      }
      throw error;
    }
  }

  private buildFilters(query: ListLoadsQueryDto): SQL[] {
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

  private toCreateValues(dto: CreateLoadDto) {
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

  private toLoad(load: LoadRecord, driver: LoadItem["driver"]): LoadItem {
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

  private async findDriverSummary(
    driverId: string,
  ): Promise<LoadItem["driver"]> {
    const [driver] = await this.databaseService.client
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

  private assertDateOrder(pickupDate: string, deliveryDate: string): void {
    if (new Date(deliveryDate) < new Date(pickupDate)) {
      throw new BadRequestException(
        "Delivery date must be on or after pickup date",
      );
    }
  }

  private async assertUpdatedDateOrder(
    id: string,
    dto: UpdateLoadDto,
  ): Promise<void> {
    if (!dto.pickupDate && !dto.deliveryDate) return;

    const [current] = await this.databaseService.client
      .select({
        pickupDate: loads.pickupDate,
        deliveryDate: loads.deliveryDate,
      })
      .from(loads)
      .where(eq(loads.id, id))
      .limit(1);

    if (!current) throw new NotFoundException("Load was not found");
    this.assertDateOrder(
      dto.pickupDate ?? current.pickupDate.toISOString(),
      dto.deliveryDate ?? current.deliveryDate.toISOString(),
    );
  }

  private async assertDriverExists(driverId: string): Promise<void> {
    const [driver] = await this.databaseService.client
      .select({ id: drivers.id })
      .from(drivers)
      .where(eq(drivers.id, driverId))
      .limit(1);

    if (!driver) throw new BadRequestException("Driver was not found");
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
