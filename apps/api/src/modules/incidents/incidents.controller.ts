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
import { IncidentsService } from "./incidents.service";
import type {
  IncidentResponse,
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

  @Post()
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateIncidentDto): Promise<IncidentResponse> {
    return this.incidentsService.create(dto);
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
