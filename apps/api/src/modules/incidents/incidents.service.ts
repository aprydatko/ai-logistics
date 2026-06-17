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
import { NotificationsService } from "../notifications/notifications.service";
import type { CreateIncidentDto } from "./dto/create-incident.dto";
import { IncidentsGateway } from "./incidents.gateway";
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
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly incidentsGateway: IncidentsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Returns a paginated, filtered list of incidents with load and driver summaries.
   *
   * Executes data and count queries in parallel using `Promise.all`. Performs
   * an INNER JOIN with loads and LEFT JOIN with drivers to include related data.
   * Supports sorting by multiple columns including priority (with custom ordering:
   * low < medium < high < critical). Supported filters: free-text search (title,
   * description, location, load referenceNumber), `type`, `priority`, `status`,
   * `loadId`, `driverId`, and date range `occurredFrom`/`occurredTo`.
   *
   * @param query - Pagination, search, sort, and filter parameters
   * @returns Paginated incident list with load and driver summaries
   */
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

  /**
   * Fetches a single incident by ID with load and driver summaries.
   *
   * @param id - Incident UUID
   * @returns Incident with load and driver data
   * @throws NotFoundException if incident does not exist
   */
  async findOne(id: string): Promise<IncidentResponse> {
    return { success: true, data: await this.findIncident(id) };
  }

  /**
   * Fetches the timeline for a specific incident.
   *
   * Returns the incident's timeline items sorted by dateTime descending
   * (most recent first). Includes incident metadata (id, updatedAt, status, priority).
   *
   * @param id - Incident UUID
   * @returns Timeline with sorted items and incident metadata
   * @throws NotFoundException if incident does not exist
   */
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

  /**
   * Creates a new incident record.
   *
   * Validates that the referenced load exists. Normalizes string fields
   * (trims whitespace). Sets resolvedAt to current timestamp if status is
   * "resolved" or "closed", otherwise null. Defaults photos and timeline
   * to empty arrays if not provided.
   *
   * @param dto - Incident creation payload
   * @returns Created incident with load and driver summaries
   * @throws NotFoundException if the referenced load does not exist
   * @throws InternalServerErrorException if database insert fails
   */
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

    const response: IncidentResponse = {
      success: true,
      data: await this.findIncident(incident.id),
    };
    await this.notificationsService.createIncidentNotifications(
      this.toIncidentNotificationInput("incident_created", response.data),
    );
    return response;
  }

  /**
   * Partially updates an incident record.
   *
   * Validates load existence if loadId is being changed. Normalizes string
   * fields (trims whitespace). Automatically updates resolvedAt based on status:
   * - If status is "resolved" or "closed", sets resolvedAt to now
   * - Otherwise sets resolvedAt to null
   * - If status is not being updated, resolvedAt remains unchanged
   *
   * @param id - Incident UUID
   * @param dto - Partial update payload
   * @returns Updated incident with load and driver summaries
   * @throws NotFoundException if incident or load does not exist
   */
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
    const response: IncidentResponse = {
      success: true,
      data: await this.findIncident(incident.id),
    };
    await this.notificationsService.createIncidentNotifications(
      this.toIncidentNotificationInput("incident_status_changed", response.data),
    );
    return response;
  }

  /**
   * Updates the timeline for an incident and notifies connected clients.
   *
   * Replaces the entire timeline with the provided array. After successful
   * update, emits a WebSocket event to all clients subscribed to this incident's
   * timeline room.
   *
   * @param id - Incident UUID
   * @param dto - Timeline update payload with new timeline array
   * @returns Updated incident with load and driver summaries
   * @throws NotFoundException if incident does not exist
   */
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
    const response: IncidentResponse = {
      success: true,
      data: await this.findIncident(incident.id),
    };
    this.incidentsGateway.emitTimelineUpdated(
      this.toTimelineFeed(response.data),
    );
    await this.notificationsService.createIncidentNotifications(
      this.toIncidentNotificationInput("incident_timeline_updated", response.data),
    );
    return response;
  }

  /**
   * Updates the status for an incident and notifies connected clients.
   *
   * Updates the status field and automatically sets resolvedAt based on
   * the new status (current timestamp for "resolved"/"closed", null otherwise).
   * After successful update, emits a WebSocket event to all clients subscribed
   * to this incident's timeline room.
   *
   * @param id - Incident UUID
   * @param dto - Status update payload with new status value
   * @returns Updated incident with load and driver summaries
   * @throws NotFoundException if incident does not exist
   */
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
    const response: IncidentResponse = {
      success: true,
      data: await this.findIncident(incident.id),
    };
    this.incidentsGateway.emitStatusUpdated(this.toTimelineFeed(response.data));
    await this.notificationsService.createIncidentNotifications(
      this.toIncidentNotificationInput("incident_status_changed", response.data),
    );
    return response;
  }

  /**
   * Builds an array of Drizzle SQL filter conditions from query parameters.
   *
   * Supports free-text search across title, description, location, and load
   * referenceNumber. Also filters by type, priority, status, loadId, driverId,
   * and date range (occurredFrom/occurredTo).
   *
   * @param query - Query parameters from ListIncidentsQueryDto
   * @returns Array of SQL filter conditions (empty if no filters provided)
   */
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

  /**
   * Returns a SQL expression for the sort column based on sortBy parameter.
   *
   * For priority sorting, uses a CASE expression to map string priorities
   * to numeric values (low=1, medium=2, high=3, critical=4) for proper ordering.
   * Defaults to occurredAt if sortBy is not recognized.
   *
   * @param sortBy - Column name to sort by
   * @returns SQL expression for the sort column
   */
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

  /**
   * Asserts that a load exists in the database.
   *
   * Queries the loads table by id and throws a NotFoundException
   * if no load is found. Used to validate loadId references before
   * creating or updating incidents.
   *
   * @param loadId - Load UUID to validate
   * @throws NotFoundException if load does not exist
   */
  private async assertLoadExists(loadId: string): Promise<void> {
    const [load] = await this.databaseService.client
      .select({ id: loads.id })
      .from(loads)
      .where(eq(loads.id, loadId))
      .limit(1);

    if (!load) throw new NotFoundException("Load was not found");
  }

  /**
   * Fetches a single incident by ID with load and driver summaries.
   *
   * Performs an INNER JOIN with loads and LEFT JOIN with drivers to include
   * related data. Transforms the database record into an API-ready IncidentItem.
   *
   * @param id - Incident UUID
   * @returns Incident with load and driver data
   * @throws NotFoundException if incident does not exist
   */
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

  private toIncidentNotificationInput(
    type: "incident_created" | "incident_status_changed" | "incident_timeline_updated",
    incident: IncidentItem,
  ) {
    const href = `/incidents/${incident.id}`;
    const messageByType = {
      incident_created: `Incident ${incident.title} was created for load #${incident.load.referenceNumber}.`,
      incident_status_changed: `Incident ${incident.title} is now ${incident.status}.`,
      incident_timeline_updated: `Timeline updated for incident ${incident.title}.`,
    } as const;

    return {
      category: "incidents" as const,
      entityId: incident.id,
      entityType: "incident" as const,
      href,
      message: messageByType[type],
      payload: {
        href,
        incidentId: incident.id,
        priority: incident.priority,
        status: incident.status,
        title: incident.title,
      },
      title:
        type === "incident_created"
          ? "New incident reported"
          : type === "incident_status_changed"
            ? "Incident status changed"
            : "Incident timeline updated",
      type,
    };
  }

  /**
   * Transforms a database IncidentRecord into an API IncidentItem response.
   *
   * Converts Date fields to ISO strings and combines the load and driver
   * data into the nested load structure.
   *
   * @param incident - Database incident record
   * @param load - Load summary without driver
   * @param driver - Driver summary or null if no driver assigned
   * @returns API-ready incident item with serialized dates
   */
  private toIncident(
    incident: IncidentRecord,
    load: Omit<IncidentItem["load"], "driver">,
    driver: IncidentItem["load"]["driver"],
  ): IncidentItem {
    const occurredAt = incident.occurredAt.toISOString();

    return {
      ...incident,
      timeline: incident.timeline.map((item) => ({
        ...item,
        dateTime: this.normalizeTimelineDateTime(item.dateTime, occurredAt),
      })),
      occurredAt,
      resolvedAt: incident.resolvedAt?.toISOString() ?? null,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
      load: { ...load, driver },
    };
  }

  /**
   * Checks if a status indicates a resolved incident.
   *
   * Returns true for "resolved" or "closed" statuses, which should
   * have a resolvedAt timestamp set.
   *
   * @param status - Incident status value
   * @returns True if status is resolved or closed
   */
  private isResolved(status: CreateIncidentDto["status"]): boolean {
    return status === "resolved" || status === "closed";
  }

  /**
   * Transforms an IncidentItem into a timeline feed for WebSocket broadcasting.
   *
   * Extracts incident metadata and sorts timeline items by dateTime descending
   * (most recent first) for real-time feed consumption.
   *
   * @param incident - Incident item with timeline
   * @returns Timeline feed data with sorted items
   */
  private toTimelineFeed(
    incident: IncidentItem,
  ): IncidentTimelineResponse["data"] {
    return {
      incidentId: incident.id,
      updatedAt: incident.updatedAt,
      status: incident.status,
      priority: incident.priority,
      items: [...incident.timeline].sort(
        (left, right) =>
          new Date(right.dateTime).getTime() -
          new Date(left.dateTime).getTime(),
      ),
    };
  }

  private normalizeTimelineDateTime(
    value: string,
    fallbackIso: string,
  ): string {
    if (!Number.isNaN(Date.parse(value))) {
      return value;
    }

    const sanitizedValue = value.replaceAll('"', "");
    if (!Number.isNaN(Date.parse(sanitizedValue))) {
      return sanitizedValue;
    }

    return fallbackIso;
  }
}
