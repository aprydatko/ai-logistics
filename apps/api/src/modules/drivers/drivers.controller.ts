import {
  Body,
  Controller,
  Delete,
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
import { CreateDriverDto } from "./dto/create-driver.dto";
import { ListDriversQueryDto } from "./dto/list-drivers-query.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { DriversService } from "./drivers.service";
import type {
  CreateDriverResponse,
  DeleteDriverResponse,
  DriverCandidatesResponse,
  DriverDetailsResponse,
  DriversListResponse,
  UpdateDriverResponse,
} from "./drivers.types";

@Controller("drivers")
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  findAll(@Query() query: ListDriversQueryDto): Promise<DriversListResponse> {
    return this.driversService.findAll(query);
  }

  @Get("candidates")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  findCandidates(): Promise<DriverCandidatesResponse> {
    return this.driversService.findCandidates();
  }

  @Get(":id")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  findById(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<DriverDetailsResponse> {
    return this.driversService.findById(id);
  }

  @Post()
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateDriverDto): Promise<CreateDriverResponse> {
    return this.driversService.create(dto);
  }

  @Patch(":id")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDriverDto,
  ): Promise<UpdateDriverResponse> {
    return this.driversService.update(id, dto);
  }

  @Delete(":id")
  @Roles("admin")
  @UseGuards(RolesGuard)
  remove(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<DeleteDriverResponse> {
    return this.driversService.remove(id);
  }
}
