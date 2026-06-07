import { Injectable } from "@nestjs/common";
import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import { drivers, type DriverRecord } from "../../db/schema";
import type { ListDriversQueryDto } from "./dto/list-drivers-query.dto";
import type { DriverListItem, DriversListResponse } from "./drivers.types";

@Injectable()
export class DriversService {
  constructor(private readonly databaseService: DatabaseService) {}

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
}
