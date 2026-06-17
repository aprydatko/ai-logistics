import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationsDeliveryService } from "./notifications-delivery.service";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsDeliveryService,
    NotificationsGateway,
    NotificationsService,
  ],
  exports: [NotificationsGateway, NotificationsService],
})
export class NotificationsModule {}
