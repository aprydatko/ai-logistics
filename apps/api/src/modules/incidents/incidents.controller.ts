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

  @Get()
  findAll(
    @Query() query: ListIncidentsQueryDto,
  ): Promise<IncidentsListResponse> {
    return this.incidentsService.findAll(query);
  }

  @Get(":id")
  findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<IncidentResponse> {
    return this.incidentsService.findOne(id);
  }

  @Get(":id/timeline")
  findTimeline(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<IncidentTimelineResponse> {
    return this.incidentsService.findTimeline(id);
  }

  @Post()
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateIncidentDto): Promise<IncidentResponse> {
    return this.incidentsService.create(dto);
  }

  @Patch(":id")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateIncidentDto,
  ): Promise<IncidentResponse> {
    return this.incidentsService.update(id, dto);
  }

  @Patch(":id/timeline")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  updateTimeline(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateIncidentTimelineDto,
  ): Promise<IncidentResponse> {
    return this.incidentsService.updateTimeline(id, dto);
  }

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
