import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import type {
  Notification,
  NotificationListResponse,
  NotificationPreference,
  NotificationPreferenceResponse,
  NotificationUnreadCountResponse,
  UpdateNotificationPreferenceDto,
  UserRole,
} from "@repo/shared/src";

import { DatabaseService } from "../../db/database.service";
import {
  notificationPreferences,
  notifications,
  users,
  type NotificationPreferenceRecord,
  type NotificationRecord,
} from "../../db/schema";
import { NotificationsDeliveryService } from "./notifications-delivery.service";
import { NotificationsGateway } from "./notifications.gateway";
import type {
  CreateNotificationInput,
  NotificationRecipient,
} from "./notifications.types";

const defaultPreferenceInput: UpdateNotificationPreferenceDto = {
  emailFrequency: "off",
  ai: { emailEnabled: false, inAppEnabled: true },
  documents: { emailEnabled: false, inAppEnabled: false },
  drivers: { emailEnabled: false, inAppEnabled: true },
  incidents: { emailEnabled: false, inAppEnabled: true },
  loads: { emailEnabled: false, inAppEnabled: true },
  system: { emailEnabled: false, inAppEnabled: false },
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notificationsDeliveryService: NotificationsDeliveryService,
  ) {}

  async listForUser(
    userId: string,
  ): Promise<NotificationListResponse> {
    const rows = await this.databaseService.client
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    return {
      success: true,
      data: rows.map((row) => this.toNotification(row)),
    };
  }

  async getUnreadCount(
    userId: string,
  ): Promise<NotificationUnreadCountResponse> {
    const [row] = await this.databaseService.client
      .select({ unreadCount: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return {
      success: true,
      data: {
        unreadCount: Number(row?.unreadCount ?? 0),
      },
    };
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationListResponse["data"][number]> {
    const [record] = await this.databaseService.client
      .update(notifications)
      .set({
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      )
      .returning();

    if (!record) throw new NotFoundException("Notification was not found");

    const unreadCount = await this.getUnreadCount(userId);
    this.notificationsGateway.emitNotificationRead(userId, notificationId);
    this.notificationsGateway.emitUnreadCountUpdated(
      userId,
      unreadCount.data.unreadCount,
    );

    return this.toNotification(record);
  }

  async markAllAsRead(userId: string): Promise<NotificationUnreadCountResponse> {
    await this.databaseService.client
      .update(notifications)
      .set({
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      );

    const unreadCount = await this.getUnreadCount(userId);
    this.notificationsGateway.emitUnreadCountUpdated(userId, 0);
    return unreadCount;
  }

  async getPreferences(
    userId: string,
  ): Promise<NotificationPreferenceResponse> {
    const record = await this.getOrCreatePreferenceRecord(userId);
    return {
      success: true,
      data: this.toPreference(record),
    };
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceResponse> {
    const existing = await this.getOrCreatePreferenceRecord(userId);
    const [updated] = await this.databaseService.client
      .update(notificationPreferences)
      .set({
        aiEmailEnabled: dto.ai.emailEnabled,
        aiInAppEnabled: dto.ai.inAppEnabled,
        documentsEmailEnabled: dto.documents.emailEnabled,
        documentsInAppEnabled: dto.documents.inAppEnabled,
        driversEmailEnabled: dto.drivers.emailEnabled,
        driversInAppEnabled: dto.drivers.inAppEnabled,
        emailFrequency: dto.emailFrequency,
        incidentsEmailEnabled: dto.incidents.emailEnabled,
        incidentsInAppEnabled: dto.incidents.inAppEnabled,
        loadsEmailEnabled: dto.loads.emailEnabled,
        loadsInAppEnabled: dto.loads.inAppEnabled,
        systemEmailEnabled: dto.system.emailEnabled,
        systemInAppEnabled: dto.system.inAppEnabled,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.id, existing.id))
      .returning();

    return {
      success: true,
      data: this.toPreference(updated ?? existing),
    };
  }

  async createIncidentNotifications(
    input: CreateNotificationInput,
  ): Promise<void> {
    const recipients = await this.findIncidentRecipients();
    if (recipients.length === 0) return;

    for (const recipient of recipients) {
      const preferenceRecord = await this.getOrCreatePreferenceRecord(recipient.id);
      const preference = this.toPreference(preferenceRecord);
      const categoryPreference = preference[input.category];
      const channels = [
        categoryPreference.inAppEnabled ? "in_app" : null,
        categoryPreference.emailEnabled ? "email" : null,
      ].filter((value): value is "email" | "in_app" => Boolean(value));

      if (channels.length === 0) continue;

      const [created] = await this.databaseService.client
        .insert(notifications)
        .values({
          userId: recipient.id,
          category: input.category,
          type: input.type,
          channels,
          title: input.title,
          message: input.message,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          href: input.href ?? null,
          payload: input.payload,
        })
        .returning();

      if (!created) continue;

      const notification = this.toNotification(created);
      this.notificationsGateway.emitNotificationCreated(recipient.id, notification);
      const unreadCount = await this.getUnreadCount(recipient.id);
      this.notificationsGateway.emitUnreadCountUpdated(
        recipient.id,
        unreadCount.data.unreadCount,
      );
      this.notificationsGateway.emitDashboardIncidentStatsUpdated(recipient.id);

      await this.notificationsDeliveryService.sendNotificationEmail({
        channels,
        notification,
        preference,
        recipient,
      });
    }
  }

  private async findIncidentRecipients(): Promise<NotificationRecipient[]> {
    const rows = await this.databaseService.client
      .select({
        email: users.email,
        firstName: users.firstName,
        id: users.id,
        lastName: users.lastName,
      })
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          or(
            eq(users.role, "admin" satisfies UserRole),
            eq(users.role, "dispatcher" satisfies UserRole),
          ),
        ),
      );

    return rows;
  }

  private async getOrCreatePreferenceRecord(
    userId: string,
  ): Promise<NotificationPreferenceRecord> {
    const [existing] = await this.databaseService.client
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (existing) return existing;

    const [created] = await this.databaseService.client
      .insert(notificationPreferences)
      .values({
        userId,
        emailFrequency: defaultPreferenceInput.emailFrequency,
      })
      .returning();

    if (!created) {
      throw new NotFoundException("Unable to create notification preferences");
    }

    return created;
  }

  private toNotification(record: NotificationRecord): Notification {
    return {
      id: record.id,
      userId: record.userId,
      category: record.category,
      type: record.type,
      channels: record.channels,
      title: record.title,
      message: record.message,
      entityType: record.entityType ?? undefined,
      entityId: record.entityId ?? undefined,
      href: record.href ?? undefined,
      readAt: record.readAt?.toISOString() ?? null,
      payload: record.payload,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private toPreference(record: NotificationPreferenceRecord): NotificationPreference {
    return {
      id: record.id,
      userId: record.userId,
      emailFrequency: record.emailFrequency,
      ai: {
        emailEnabled: record.aiEmailEnabled,
        inAppEnabled: record.aiInAppEnabled,
      },
      documents: {
        emailEnabled: record.documentsEmailEnabled,
        inAppEnabled: record.documentsInAppEnabled,
      },
      drivers: {
        emailEnabled: record.driversEmailEnabled,
        inAppEnabled: record.driversInAppEnabled,
      },
      incidents: {
        emailEnabled: record.incidentsEmailEnabled,
        inAppEnabled: record.incidentsInAppEnabled,
      },
      loads: {
        emailEnabled: record.loadsEmailEnabled,
        inAppEnabled: record.loadsInAppEnabled,
      },
      system: {
        emailEnabled: record.systemEmailEnabled,
        inAppEnabled: record.systemInAppEnabled,
      },
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
