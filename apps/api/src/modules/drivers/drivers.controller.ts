import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ListDriversQueryDto } from "./dto/list-drivers-query.dto";
import { DriversService } from "./drivers.service";
import type { DriversListResponse } from "./drivers.types";

@Controller("drivers")
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  findAll(@Query() query: ListDriversQueryDto): Promise<DriversListResponse> {
    return this.driversService.findAll(query);
  }
}
