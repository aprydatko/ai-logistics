import {
  Body,
  Controller,
  Get,
  Param,
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
import { DriversService } from "./drivers.service";
import type {
  CreateDriverResponse,
  DriverDetailsResponse,
  DriversListResponse,
} from "./drivers.types";

@Controller("drivers")
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  findAll(@Query() query: ListDriversQueryDto): Promise<DriversListResponse> {
    return this.driversService.findAll(query);
  }

  @Get(":id")
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
}
