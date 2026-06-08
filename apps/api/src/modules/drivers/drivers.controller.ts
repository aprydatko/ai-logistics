import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { CreateDriverDocumentDto } from "./dto/create-driver-document.dto";
import { ListDriversQueryDto } from "./dto/list-drivers-query.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { UpsertDriverVehicleDto } from "./dto/upsert-driver-vehicle.dto";
import { DriversService } from "./drivers.service";
import type {
  CreateDriverResponse,
  CreateDriverDocumentResponse,
  DeleteDriverDocumentResponse,
  DeleteDriverResponse,
  DriverCandidatesResponse,
  DriverDetailsResponse,
  DriversListResponse,
  UpdateDriverResponse,
  UpsertDriverVehicleResponse,
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

  @Post(":id/documents")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  addDocument(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CreateDriverDocumentDto,
  ): Promise<CreateDriverDocumentResponse> {
    return this.driversService.addDocument(id, dto);
  }

  @Delete(":id/documents/:documentId")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  removeDocument(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("documentId", new ParseUUIDPipe()) documentId: string,
  ): Promise<DeleteDriverDocumentResponse> {
    return this.driversService.removeDocument(id, documentId);
  }

  @Put(":id/vehicle")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  upsertVehicle(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpsertDriverVehicleDto,
  ): Promise<UpsertDriverVehicleResponse> {
    return this.driversService.upsertVehicle(id, dto);
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
