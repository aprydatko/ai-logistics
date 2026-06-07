import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import { drivers, type DriverRecord, users } from "../../db/schema";
import type { CreateDriverDto } from "./dto/create-driver.dto";
import type { ListDriversQueryDto } from "./dto/list-drivers-query.dto";
import type {
  CreateDriverResponse,
  DriverListItem,
  DriversListResponse,
} from "./drivers.types";

@Injectable()
export class DriversService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateDriverDto): Promise<CreateDriverResponse> {
    const [user] = await this.databaseService.client
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, dto.userId))
      .limit(1);

    if (!user || user.role !== "driver") {
      throw new BadRequestException("Driver user was not found");
    }

    try {
      const [driver] = await this.databaseService.client
        .insert(drivers)
        .values({
          ...dto,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone.trim(),
          truckNumber: dto.truckNumber.trim(),
          trailerNumber: dto.trailerNumber.trim(),
        })
        .returning();

      if (!driver) {
        throw new InternalServerErrorException("Failed to create driver");
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

  async findAll(query: ListDriversQueryDto): Promise<DriversListResponse> {
    const filters = this.buildFilters(query);
    const rows = await this.databaseService.client
      .select()
      .from(drivers)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(asc(drivers.lastName), asc(drivers.firstName))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    return {
      success: true,
      data: rows.map((driver) => this.toDriver(driver)),
    };
  }

  private buildFilters(query: ListDriversQueryDto): SQL[] {
    const filters: SQL[] = [];

    if (query.search) {
      const pattern = `%${query.search}%`;
      const searchFilter = or(
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
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
    };
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
