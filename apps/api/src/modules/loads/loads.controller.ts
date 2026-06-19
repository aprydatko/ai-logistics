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
import { AssignLoadDriverDto } from "./dto/assign-load-driver.dto";
import { CreateLoadDto } from "./dto/create-load.dto";
import { ListLoadsQueryDto } from "./dto/list-loads-query.dto";
import { UpdateLoadDto } from "./dto/update-load.dto";
import { LoadsService } from "./loads.service";
import type {
  AssignLoadDriverResponse,
  CreateLoadResponse,
  LoadActivityResponse,
  LoadMetricsResponse,
  LoadResponse,
  LoadSuggestionsResponse,
  LoadsListResponse,
  UpdateLoadResponse,
} from "./loads.types";

@Controller("loads")
@UseGuards(JwtAuthGuard)
export class LoadsController {
  constructor(private readonly loadsService: LoadsService) {}

  @Get()
  findAll(@Query() query: ListLoadsQueryDto): Promise<LoadsListResponse> {
    return this.loadsService.findAll(query);
  }

  @Get("metrics")
  findMetrics(): Promise<LoadMetricsResponse> {
    return this.loadsService.getMetrics();
  }

  @Get("activity")
  findActivity(): Promise<LoadActivityResponse> {
    return this.loadsService.getActivity();
  }

  @Get("suggestions")
  findSuggestions(): Promise<LoadSuggestionsResponse> {
    return this.loadsService.getSuggestions();
  }

  @Get(":id")
  findById(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<LoadResponse> {
    return this.loadsService.findById(id);
  }

  @Post()
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateLoadDto): Promise<CreateLoadResponse> {
    return this.loadsService.create(dto);
  }

  @Patch(":id/assign-driver")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  assignDriver(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: AssignLoadDriverDto,
  ): Promise<AssignLoadDriverResponse> {
    return this.loadsService.assignDriver(id, dto);
  }

  @Patch(":id")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLoadDto,
  ): Promise<UpdateLoadResponse> {
    return this.loadsService.update(id, dto);
  }
}
