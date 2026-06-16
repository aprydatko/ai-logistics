import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { ListIncidentsQueryDto } from "./dto/list-incidents-query.dto";
import { UpdateIncidentStatusDto } from "./dto/update-incident-status.dto";
import { UpdateIncidentTimelineDto } from "./dto/update-incident-timeline.dto";
import { UpdateIncidentDto } from "./dto/update-incident.dto";
import { IncidentsService } from "./incidents.service";
import type {
  IncidentResponse,
  IncidentTimelineResponse,
  IncidentsListResponse,
} from "./incidents.types";

@Controller("incidents")
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  /**
   * GET /incidents - Returns a paginated, filtered list of incidents.
   *
   * @param query - Pagination, search, sort, and filter parameters
   * @returns Paginated incident list with load and driver summaries
   */
  @Get()
  findAll(
    @Query() query: ListIncidentsQueryDto,
  ): Promise<IncidentsListResponse> {
    return this.incidentsService.findAll(query);
  }

  /**
   * GET /incidents/:id - Fetches a single incident by ID.
   *
   * @param id - Incident UUID
   * @returns Incident with load and driver summaries
   */
  @Get(":id")
  findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<IncidentResponse> {
    return this.incidentsService.findOne(id);
  }

  /**
   * GET /incidents/:id/timeline - Fetches the timeline for a specific incident.
   *
   * @param id - Incident UUID
   * @returns Timeline with sorted items and incident metadata
   */
  @Get(":id/timeline")
  findTimeline(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<IncidentTimelineResponse> {
    return this.incidentsService.findTimeline(id);
  }

  /**
   * POST /incidents - Creates a new incident.
   *
   * Requires admin or dispatcher role.
   *
   * @param dto - Incident creation payload
   * @returns Created incident with load and driver summaries
   */
  @Post()
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateIncidentDto): Promise<IncidentResponse> {
    return this.incidentsService.create(dto);
  }

  /**
   * PATCH /incidents/:id - Partially updates an incident.
   *
   * Requires admin or dispatcher role.
   *
   * @param id - Incident UUID
   * @param dto - Partial update payload
   * @returns Updated incident with load and driver summaries
   */
  @Patch(":id")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateIncidentDto,
  ): Promise<IncidentResponse> {
    return this.incidentsService.update(id, dto);
  }

  /**
   * PATCH /incidents/:id/timeline - Updates the timeline for an incident.
   *
   * Requires admin or dispatcher role. Emits WebSocket event to
   * subscribed clients after successful update.
   *
   * @param id - Incident UUID
   * @param dto - Timeline update payload with new timeline array
   * @returns Updated incident with load and driver summaries
   */
  @Patch(":id/timeline")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  updateTimeline(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateIncidentTimelineDto,
  ): Promise<IncidentResponse> {
    return this.incidentsService.updateTimeline(id, dto);
  }

  /**
   * PATCH /incidents/:id/status - Updates the status for an incident.
   *
   * Requires admin or dispatcher role. Emits WebSocket event to
   * subscribed clients after successful update.
   *
   * @param id - Incident UUID
   * @param dto - Status update payload with new status value
   * @returns Updated incident with load and driver summaries
   */
  @Patch(":id/status")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  updateStatus(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateIncidentStatusDto,
  ): Promise<IncidentResponse> {
    return this.incidentsService.updateStatus(id, dto);
  }
}
