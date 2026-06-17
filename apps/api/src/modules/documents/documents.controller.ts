import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle, minutes } from "@nestjs/throttler";
import { memoryStorage } from "multer";

import { AuthenticatedThrottlerGuard } from "../auth/authenticated-throttler.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { DocumentsService } from "./documents.service";
import type {
  DeleteDocumentResult,
  DocumentResult,
  DocumentsListResult,
} from "./documents.types";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { ListDocumentsQueryDto } from "./dto/list-documents-query.dto";
import { ReplaceDocumentAuditEventsDto } from "./dto/replace-document-audit-events.dto";
import { ReplaceDocumentExtractedFieldsDto } from "./dto/replace-document-extracted-fields.dto";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll(@Query() query: ListDocumentsQueryDto): Promise<DocumentsListResult> {
    return this.documentsService.findAll(query);
  }

  @Post()
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DocumentResult> {
    return this.documentsService.create(dto, user.id);
  }

  @Post("upload")
  @HttpCode(201)
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard, AuthenticatedThrottlerGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: minutes(10),
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DocumentResult> {
    return this.documentsService.upload(file, dto, user.id);
  }

  @Get(":id")
  findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<DocumentResult> {
    return this.documentsService.findOne(id);
  }

  @Patch(":id")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<DocumentResult> {
    return this.documentsService.update(id, dto);
  }

  @Patch(":id/extracted-fields")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  replaceExtractedFields(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: ReplaceDocumentExtractedFieldsDto,
  ): Promise<DocumentResult> {
    return this.documentsService.replaceExtractedFields(id, dto.fields);
  }

  @Patch(":id/audit-events")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  replaceAuditEvents(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: ReplaceDocumentAuditEventsDto,
  ): Promise<DocumentResult> {
    return this.documentsService.replaceAuditEvents(id, dto.events);
  }

  @Delete(":id")
  @Roles("admin", "dispatcher")
  @UseGuards(RolesGuard)
  remove(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<DeleteDocumentResult> {
    return this.documentsService.remove(id);
  }
}
