import {
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
  gte,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import {
  drivers,
  incidents,
  loads,
  type IncidentRecord,
} from "../../db/schema";
import type { CreateIncidentDto } from "./dto/create-incident.dto";
import type { ListIncidentsQueryDto } from "./dto/list-incidents-query.dto";
import type { UpdateIncidentStatusDto } from "./dto/update-incident-status.dto";
import type { UpdateIncidentTimelineDto } from "./dto/update-incident-timeline.dto";
import type { UpdateIncidentDto } from "./dto/update-incident.dto";
import type {
  IncidentItem,
  IncidentResponse,
  IncidentTimelineResponse,
  IncidentsListResponse,
} from "./incidents.types";

@Injectable()
export class IncidentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query: ListIncidentsQueryDto): Promise<IncidentsListResponse> {
    const filters = this.buildFilters(query);
    const where = filters.length > 0 ? and(...filters) : undefined;
    const order = query.sortOrder === "asc" ? asc : desc;
    const orderColumn = this.getSortColumn(query.sortBy);
    const baseQuery = this.databaseService.client
      .select({
        incident: incidents,
        load: {
          id: loads.id,
          referenceNumber: loads.referenceNumber,
        },
        driver: {
          id: drivers.id,
          firstName: drivers.firstName,
          lastName: drivers.lastName,
          avatarUrl: drivers.avatarUrl,
          truckNumber: drivers.truckNumber,
        },
      })
      .from(incidents)
      .innerJoin(loads, eq(incidents.loadId, loads.id))
      .leftJoin(drivers, eq(loads.driverId, drivers.id))
      .where(where);

    const [rows, countRows] = await Promise.all([
      baseQuery
        .orderBy(order(orderColumn), desc(incidents.id))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.databaseService.client
        .select({ total: count() })
        .from(incidents)
        .innerJoin(loads, eq(incidents.loadId, loads.id))
        .where(where),
    ]);
    const total = countRows[0]?.total ?? 0;

    return {
      success: true,
      data: rows.map((row) =>
        this.toIncident(
          row.incident,
          row.load,
          row.driver?.id ? row.driver : null,
        ),
      ),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string): Promise<IncidentResponse> {
    return { success: true, data: await this.findIncident(id) };
  }

  async findTimeline(id: string): Promise<IncidentTimelineResponse> {
    const incident = await this.findIncident(id);

    return {
      success: true,
      data: {
        incidentId: incident.id,
        updatedAt: incident.updatedAt,
        status: incident.status,
        priority: incident.priority,
        items: [...incident.timeline].sort(
          (left, right) =>
            new Date(right.dateTime).getTime() -
            new Date(left.dateTime).getTime(),
        ),
      },
    };
  }

  async create(dto: CreateIncidentDto): Promise<IncidentResponse> {
    await this.assertLoadExists(dto.loadId);
    const [incident] = await this.databaseService.client
      .insert(incidents)
      .values({
        ...dto,
        title: dto.title.trim(),
        description: dto.description.trim(),
        location: dto.location?.trim() || null,
        photos: dto.photos ?? [],
        timeline: dto.timeline ?? [],
        occurredAt: new Date(dto.occurredAt),
        resolvedAt: this.isResolved(dto.status) ? new Date() : null,
      })
      .returning();

    if (!incident) {
      throw new InternalServerErrorException("Failed to create incident");
    }

    return { success: true, data: await this.findIncident(incident.id) };
  }

  async update(id: string, dto: UpdateIncidentDto): Promise<IncidentResponse> {
    if (dto.loadId) await this.assertLoadExists(dto.loadId);

    const [incident] = await this.databaseService.client
      .update(incidents)
      .set({
        ...dto,
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        location:
          dto.location?.trim() || (dto.location === "" ? null : undefined),
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        resolvedAt: dto.status
          ? this.isResolved(dto.status)
            ? new Date()
            : null
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, id))
      .returning({ id: incidents.id });

    if (!incident) throw new NotFoundException("Incident was not found");
    return { success: true, data: await this.findIncident(incident.id) };
  }

  async updateTimeline(
    id: string,
    dto: UpdateIncidentTimelineDto,
  ): Promise<IncidentResponse> {
    const [incident] = await this.databaseService.client
      .update(incidents)
      .set({ timeline: dto.timeline, updatedAt: new Date() })
      .where(eq(incidents.id, id))
      .returning({ id: incidents.id });

    if (!incident) throw new NotFoundException("Incident was not found");
    return { success: true, data: await this.findIncident(incident.id) };
  }

  async updateStatus(
    id: string,
    dto: UpdateIncidentStatusDto,
  ): Promise<IncidentResponse> {
    const [incident] = await this.databaseService.client
      .update(incidents)
      .set({
        status: dto.status,
        resolvedAt: this.isResolved(dto.status) ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, id))
      .returning({ id: incidents.id });

    if (!incident) throw new NotFoundException("Incident was not found");
    return { success: true, data: await this.findIncident(incident.id) };
  }

  private buildFilters(query: ListIncidentsQueryDto): SQL[] {
    const filters: SQL[] = [];

    if (query.search) {
      const pattern = `%${query.search}%`;
      const search = or(
        ilike(incidents.title, pattern),
        ilike(incidents.description, pattern),
        ilike(incidents.location, pattern),
        ilike(loads.referenceNumber, pattern),
      );
      if (search) filters.push(search);
    }
    if (query.type) filters.push(eq(incidents.type, query.type));
    if (query.priority) filters.push(eq(incidents.priority, query.priority));
    if (query.status) filters.push(eq(incidents.status, query.status));
    if (query.loadId) filters.push(eq(incidents.loadId, query.loadId));
    if (query.driverId) filters.push(eq(loads.driverId, query.driverId));
    if (query.occurredFrom) {
      filters.push(gte(incidents.occurredAt, new Date(query.occurredFrom)));
    }
    if (query.occurredTo) {
      filters.push(lte(incidents.occurredAt, new Date(query.occurredTo)));
    }

    return filters;
  }

  private getSortColumn(sortBy: ListIncidentsQueryDto["sortBy"]): SQL {
    if (sortBy === "createdAt") return sql`${incidents.createdAt}`;
    if (sortBy === "title") return sql`${incidents.title}`;
    if (sortBy === "updatedAt") return sql`${incidents.updatedAt}`;
    if (sortBy === "priority") {
      return sql`case ${incidents.priority}
        when 'low' then 1
        when 'medium' then 2
        when 'high' then 3
        when 'critical' then 4
      end`;
    }
    return sql`${incidents.occurredAt}`;
  }

  private async assertLoadExists(loadId: string): Promise<void> {
    const [load] = await this.databaseService.client
      .select({ id: loads.id })
      .from(loads)
      .where(eq(loads.id, loadId))
      .limit(1);

    if (!load) throw new NotFoundException("Load was not found");
  }

  private async findIncident(id: string): Promise<IncidentItem> {
    const [row] = await this.databaseService.client
      .select({
        incident: incidents,
        load: {
          id: loads.id,
          referenceNumber: loads.referenceNumber,
        },
        driver: {
          id: drivers.id,
          firstName: drivers.firstName,
          lastName: drivers.lastName,
          avatarUrl: drivers.avatarUrl,
          truckNumber: drivers.truckNumber,
        },
      })
      .from(incidents)
      .innerJoin(loads, eq(incidents.loadId, loads.id))
      .leftJoin(drivers, eq(loads.driverId, drivers.id))
      .where(eq(incidents.id, id))
      .limit(1);

    if (!row) throw new NotFoundException("Incident was not found");
    return this.toIncident(
      row.incident,
      row.load,
      row.driver?.id ? row.driver : null,
    );
  }

  private toIncident(
    incident: IncidentRecord,
    load: Omit<IncidentItem["load"], "driver">,
    driver: IncidentItem["load"]["driver"],
  ): IncidentItem {
    return {
      ...incident,
      occurredAt: incident.occurredAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString() ?? null,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
      load: { ...load, driver },
    };
  }

  private isResolved(status: CreateIncidentDto["status"]): boolean {
    return status === "resolved" || status === "closed";
  }
}
