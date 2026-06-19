import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import type {
  Notification,
  NotificationPreferenceResponse,
  NotificationUnreadCountResponse,
} from "@repo/shared/src";

import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";
import { UpdateNotificationPreferencesDto } from "./dto/update-notification-preferences.dto";
import { NotificationsService } from "./notifications.service";
import type { NotificationListResult } from "./notifications.types";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationListResult> {
    return this.notificationsService.listForUser(user.id, query);
  }

  @Get("unread-count")
  getUnreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationUnreadCountResponse> {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Get("preferences")
  getPreferences(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationPreferenceResponse> {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch("preferences")
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferenceResponse> {
    return this.notificationsService.updatePreferences(user.id, dto);
  }

  @Patch("read-all")
  markAllAsRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationUnreadCountResponse> {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch(":id/read")
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(user.id, id);
  }
}
