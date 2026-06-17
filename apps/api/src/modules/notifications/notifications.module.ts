import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { QueueModule } from "../queue/queue.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationsDeliveryService } from "./notifications-delivery.service";
import { NotificationsEmailWorkerService } from "./notifications-email-worker.service";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [AuthModule, QueueModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsDeliveryService,
    NotificationsEmailWorkerService,
    NotificationsGateway,
    NotificationsService,
  ],
  exports: [NotificationsGateway, NotificationsService],
})
export class NotificationsModule {}
