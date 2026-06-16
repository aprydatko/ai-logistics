import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { DocumentsController } from "./documents.controller";
import { DocumentStorageService } from "./document-storage.service";
import { DocumentVisionService } from "./document-vision.service";
import { DocumentsService } from "./documents.service";

@Module({
  imports: [AuthModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentStorageService, DocumentVisionService],
})
export class DocumentsModule {}
