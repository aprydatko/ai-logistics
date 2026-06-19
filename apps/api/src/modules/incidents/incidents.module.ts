import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CacheModule } from "../cache/cache.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { IncidentsController } from "./incidents.controller";
import { IncidentsGateway } from "./incidents.gateway";
import { IncidentsService } from "./incidents.service";

@Module({
  imports: [AuthModule, NotificationsModule, CacheModule],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsGateway],
  exports: [IncidentsService],
})
export class IncidentsModule {}
