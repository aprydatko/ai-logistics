import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { QueueModule } from "../queue/queue.module";
import { DocumentProcessingWorkerService } from "./document-processing-worker.service";
import { DocumentsController } from "./documents.controller";
import { DocumentStorageService } from "./document-storage.service";
import { DocumentVisionService } from "./document-vision.service";
import { DocumentsService } from "./documents.service";

@Module({
  imports: [AuthModule, QueueModule, NotificationsModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentStorageService,
    DocumentVisionService,
    DocumentProcessingWorkerService,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
