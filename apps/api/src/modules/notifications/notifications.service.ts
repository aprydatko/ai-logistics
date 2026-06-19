import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  Notification,
  NotificationPreferenceResponse,
  NotificationUnreadCountResponse,
  UpdateNotificationPreferenceDto,
} from "@repo/shared/src";
import type { Queue } from "bullmq";
import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";

import {
  ADMIN_DISPATCHER_ROLES,
  DOCUMENT_RECIPIENT_ROLES,
} from "../../common/roles";
import {
  decodeCursor,
  encodeCursor,
} from "../../common/pagination/cursor-pagination";
import { DatabaseService } from "../../db/database.service";
import {
  notificationPreferences,
  notifications,
  users,
  type NotificationPreferenceRecord,
} from "../../db/schema";
import { EMAIL_NOTIFICATIONS_QUEUE_TOKEN } from "../queue/queue.constants";
import type { EmailNotificationJobData } from "../queue/queue.types";
import {
  dispatchNotification,
  resolveChannels,
  type DispatcherDeps,
} from "./internal/notification.dispatch";
import { toNotification, toPreference } from "./internal/notification.mapper";
import {
  defaultPreferenceInput,
  isLegacyDocumentsOffRecord,
} from "./internal/notification.preferences";
import { NotificationsDeliveryService } from "./notifications-delivery.service";
import { NotificationsGateway } from "./notifications.gateway";
import type { ListNotificationsQueryDto } from "./dto/list-notifications-query.dto";
import type {
  CreateNotificationInput,
  NotificationListResult,
  NotificationRecipient,
} from "./notifications.types";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notificationsDeliveryService: NotificationsDeliveryService,
    @Inject(EMAIL_NOTIFICATIONS_QUEUE_TOKEN)
    private readonly emailNotificationsQueue: Queue<EmailNotificationJobData>,
  ) {}

  /**
   * Returns a cursor-paginated notification feed for a user, newest first.
   *
   * @param userId - Authenticated user ID.
   * @returns Envelope with a list of notifications mapped to the public
   *   `Notification` DTO shape (ISO date strings, optional fields normalized).
   */
  async listForUser(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<NotificationListResult> {
    const cursorFilter = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.databaseService.client
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          cursorFilter
            ? or(
                lt(notifications.createdAt, cursorFilter.createdAt),
                and(
                  eq(notifications.createdAt, cursorFilter.createdAt),
                  lt(notifications.id, cursorFilter.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(query.limit + 1);
    const hasMore = rows.length > query.limit;
    const dataRows = rows.slice(0, query.limit);
    const lastRow = dataRows[dataRows.length - 1];

    return {
      success: true,
      data: dataRows.map((row) => toNotification(row)),
      pageInfo: {
        limit: query.limit,
        hasMore,
        nextCursor:
          hasMore && lastRow
            ? encodeCursor({
                createdAt: lastRow.createdAt,
                id: lastRow.id,
              })
            : null,
      },
    };
  }

  /**
   * Counts unread notifications for a user.
   *
   * @param userId - Authenticated user ID.
   * @returns Envelope with a single `unreadCount` integer (0 when none).
   */
  async getUnreadCount(
    userId: string,
  ): Promise<NotificationUnreadCountResponse> {
    const [row] = await this.databaseService.client
      .select({ unreadCount: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      );

    return {
      success: true,
      data: {
        unreadCount: Number(row?.unreadCount ?? 0),
      },
    };
  }

  /**
   * Marks a single notification as read for the given user.
   *
   * Ownership is enforced by the `WHERE userId = $userId` clause: a
   * notification belonging to another user (or non-existent) raises
   * `NotFoundException` (HTTP 404) instead of leaking existence.
   *
   * On success emits two realtime events:
   * - `notification.read` (carrying the id)
   * - `notifications.unread-count.updated` (carrying the new total)
   *
   * @param userId - Authenticated user ID.
   * @param notificationId - UUID of the notification to mark as read.
   * @returns The updated notification as a public DTO.
   * @throws {NotFoundException} When no matching notification exists for the user.
   */
  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<Notification> {
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

    return toNotification(record);
  }

  /**
   * Marks every unread notification of a user as read in a single statement.
   *
   * Emits `notifications.unread-count.updated` with `0` since the count is
   * known without re-querying.
   *
   * @param userId - Authenticated user ID.
   * @returns Envelope with the new (always 0) unread count.
   */
  async markAllAsRead(
    userId: string,
  ): Promise<NotificationUnreadCountResponse> {
    await this.databaseService.client
      .update(notifications)
      .set({
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      );

    this.notificationsGateway.emitUnreadCountUpdated(userId, 0);
    return {
      success: true,
      data: { unreadCount: 0 },
    };
  }

  /**
   * Returns the notification preferences for a user, creating a default
   * record on first access. Legacy records (see {@link isLegacyDocumentsOffRecord})
   * are upgraded in place so the API response always reflects current defaults.
   *
   * @param userId - Authenticated user ID.
   * @returns Envelope with the user's notification preferences.
   */
  async getPreferences(
    userId: string,
  ): Promise<NotificationPreferenceResponse> {
    const record = await this.getOrCreatePreferenceRecord(userId);
    return {
      success: true,
      data: toPreference(record),
    };
  }

  /**
   * Replaces the full set of notification preferences for a user.
   *
   * The update is a full overwrite (not a patch) — every category and the
   * `emailFrequency` must be supplied by the client. The shared DTO is
   * validated upstream by `UpdateNotificationPreferencesDto`.
   *
   * @param userId - Authenticated user ID.
   * @param dto - New preference values per category plus email frequency.
   * @returns Envelope with the persisted preferences after the update.
   */
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
      data: toPreference(updated ?? existing),
    };
  }

  /**
   * Fans an incident notification out to every active admin/dispatcher user.
   *
   * For each recipient, channel selection respects the user's per-category
   * preference. Realtime events `notification.created`,
   * `notifications.unread-count.updated` and `dashboard.incident-stats.updated`
   * are emitted; an email job is enqueued when the email channel is on.
   *
   * Silently no-ops when there are no eligible recipients.
   *
   * @param input - Notification content plus category/type/entity context.
   */
  async createIncidentNotifications(
    input: CreateNotificationInput,
  ): Promise<void> {
    const recipients = await this.findOperationsRecipients();
    if (recipients.length === 0) return;

    const preferencesMap = await this.getOrCreatePreferenceRecords(
      recipients.map((r) => r.id),
    );

    for (const recipient of recipients) {
      const preferenceRecord = preferencesMap.get(recipient.id);
      if (!preferenceRecord) continue;

      const preference = toPreference(preferenceRecord);
      const categoryPreference = preference[input.category];
      const channels = resolveChannels({
        emailEnabled: categoryPreference.emailEnabled,
        inAppEnabled: categoryPreference.inAppEnabled,
      });

      await dispatchNotification(recipient, this.dispatcherDeps, {
        channels,
        payload: input.payload,
        base: {
          category: input.category,
          type: input.type,
          title: input.title,
          message: input.message,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          href: input.href ?? null,
        },
        preference,
        emitDashboardIncidentStats: true,
      });
    }
  }

  /**
   * Fans a document-processing notification out to eligible recipients.
   *
   * "processing" status is treated as a no-op (intermediate state, not
   * actionable). "complete" and "needs_review" produce distinct title/body
   * copy and always deep-link to `/documents/{documentId}`.
   *
   * The uploader is included in recipients regardless of their preferences
   * (they always get the in-app channel) so they can see the result of
   * their own upload.
   *
   * @param input - Document id, file name, terminal status, and optional uploader id.
   */
  async createDocumentProcessingNotifications(input: {
    documentId: string;
    fileName: string;
    status: "complete" | "needs_review" | "processing";
    uploadedByUserId?: string | null;
  }): Promise<void> {
    if (input.status === "processing") return;

    const recipients = await this.findDocumentRecipients(
      input.uploadedByUserId,
    );
    if (recipients.length === 0) return;

    const preferencesMap = await this.getOrCreatePreferenceRecords(
      recipients.map((r) => r.id),
    );

    const title =
      input.status === "needs_review"
        ? "Document ready for review"
        : "Document processing complete";
    const message =
      input.status === "needs_review"
        ? `${input.fileName} has extracted fields ready for review.`
        : `${input.fileName} finished processing successfully.`;
    const href = `/documents/${input.documentId}`;

    for (const recipient of recipients) {
      const preferenceRecord = preferencesMap.get(recipient.id);
      if (!preferenceRecord) continue;

      const preference = toPreference(preferenceRecord);
      const categoryPreference = preference.documents;
      // The uploader always gets an in-app notification for their own
      // upload so they can see the result regardless of preference state.
      const isUploader = input.uploadedByUserId === recipient.id;
      const channels = resolveChannels({
        emailEnabled: categoryPreference.emailEnabled,
        inAppEnabled: categoryPreference.inAppEnabled,
        forceInApp: isUploader,
      });

      await dispatchNotification(recipient, this.dispatcherDeps, {
        channels,
        payload: {
          href,
          title: input.fileName,
        },
        base: {
          category: "documents",
          type: "system",
          title,
          message,
          entityType: null,
          entityId: input.documentId,
          href,
        },
        preference,
        emitDashboardIncidentStats: false,
      });
    }
  }

  /**
   * Returns the preference record for a user, materializing defaults on first
   * access and upgrading legacy rows in place.
   *
   * @param userId - Authenticated user ID.
   * @returns The persisted preference record (always non-null).
   * @throws {NotFoundException} When the database fails to insert a new record.
   */
  private async getOrCreatePreferenceRecord(
    userId: string,
  ): Promise<NotificationPreferenceRecord> {
    const [existing] = await this.databaseService.client
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (existing) {
      if (isLegacyDocumentsOffRecord(existing)) {
        const [updated] = await this.databaseService.client
          .update(notificationPreferences)
          .set({
            documentsInAppEnabled: true,
            updatedAt: new Date(),
          })
          .where(eq(notificationPreferences.id, existing.id))
          .returning();

        return updated ?? existing;
      }

      return existing;
    }

    const [created] = await this.databaseService.client
      .insert(notificationPreferences)
      .values({
        aiInAppEnabled: defaultPreferenceInput.ai.inAppEnabled,
        aiEmailEnabled: defaultPreferenceInput.ai.emailEnabled,
        documentsInAppEnabled: defaultPreferenceInput.documents.inAppEnabled,
        documentsEmailEnabled: defaultPreferenceInput.documents.emailEnabled,
        driversInAppEnabled: defaultPreferenceInput.drivers.inAppEnabled,
        driversEmailEnabled: defaultPreferenceInput.drivers.emailEnabled,
        incidentsInAppEnabled: defaultPreferenceInput.incidents.inAppEnabled,
        incidentsEmailEnabled: defaultPreferenceInput.incidents.emailEnabled,
        loadsInAppEnabled: defaultPreferenceInput.loads.inAppEnabled,
        loadsEmailEnabled: defaultPreferenceInput.loads.emailEnabled,
        systemInAppEnabled: defaultPreferenceInput.system.inAppEnabled,
        systemEmailEnabled: defaultPreferenceInput.system.emailEnabled,
        userId,
        emailFrequency: defaultPreferenceInput.emailFrequency,
      })
      .returning();

    if (!created) {
      throw new NotFoundException("Unable to create notification preferences");
    }

    return created;
  }

  /**
   * Returns preference records for multiple users in a single query,
   * materializing defaults for missing users and upgrading legacy rows.
   *
   * @param userIds - Array of authenticated user IDs.
   * @returns Map of userId to preference record.
   */
  private async getOrCreatePreferenceRecords(
    userIds: string[],
  ): Promise<Map<string, NotificationPreferenceRecord>> {
    if (userIds.length === 0) return new Map();

    const existingRecords = await this.databaseService.client
      .select()
      .from(notificationPreferences)
      .where(
        or(
          ...userIds.map((userId) =>
            eq(notificationPreferences.userId, userId),
          ),
        ),
      );

    const existingMap = new Map(
      existingRecords.map((record) => [record.userId, record]),
    );
    const result = new Map<string, NotificationPreferenceRecord>();

    // Process existing records, upgrade legacy ones
    for (const record of existingRecords) {
      if (isLegacyDocumentsOffRecord(record)) {
        const [updated] = await this.databaseService.client
          .update(notificationPreferences)
          .set({
            documentsInAppEnabled: true,
            updatedAt: new Date(),
          })
          .where(eq(notificationPreferences.id, record.id))
          .returning();

        result.set(record.userId, updated ?? record);
      } else {
        result.set(record.userId, record);
      }
    }

    // Create missing records
    const missingUserIds = userIds.filter((id) => !existingMap.has(id));
    if (missingUserIds.length > 0) {
      const newRecords = await this.databaseService.client
        .insert(notificationPreferences)
        .values(
          missingUserIds.map((userId) => ({
            aiInAppEnabled: defaultPreferenceInput.ai.inAppEnabled,
            aiEmailEnabled: defaultPreferenceInput.ai.emailEnabled,
            documentsInAppEnabled:
              defaultPreferenceInput.documents.inAppEnabled,
            documentsEmailEnabled:
              defaultPreferenceInput.documents.emailEnabled,
            driversInAppEnabled: defaultPreferenceInput.drivers.inAppEnabled,
            driversEmailEnabled: defaultPreferenceInput.drivers.emailEnabled,
            incidentsInAppEnabled:
              defaultPreferenceInput.incidents.inAppEnabled,
            incidentsEmailEnabled:
              defaultPreferenceInput.incidents.emailEnabled,
            loadsInAppEnabled: defaultPreferenceInput.loads.inAppEnabled,
            loadsEmailEnabled: defaultPreferenceInput.loads.emailEnabled,
            systemInAppEnabled: defaultPreferenceInput.system.inAppEnabled,
            systemEmailEnabled: defaultPreferenceInput.system.emailEnabled,
            userId,
            emailFrequency: defaultPreferenceInput.emailFrequency,
          })),
        )
        .returning();

      for (const record of newRecords) {
        result.set(record.userId, record);
      }
    }

    return result;
  }

  /**
   * Dependency bag for the pure `dispatchNotification` helper. Built once
   * per call and passed in so the dispatcher doesn't need to know about
   * Nest injection.
   */
  private get dispatcherDeps(): DispatcherDeps {
    return {
      client: this.databaseService.client as DispatcherDeps["client"],
      emailQueue: this.emailNotificationsQueue,
      emitDashboardIncidentStats: (userId) =>
        this.notificationsGateway.emitDashboardIncidentStatsUpdated(userId),
      emitNotificationCreated: (userId, notification) =>
        this.notificationsGateway.emitNotificationCreated(
          userId,
          notification as Parameters<
            typeof this.notificationsGateway.emitNotificationCreated
          >[1],
        ),
      emitUnreadCountUpdated: (userId, unreadCount) =>
        this.notificationsGateway.emitUnreadCountUpdated(userId, unreadCount),
      getUnreadCount: (userId) => this.getUnreadCount(userId),
    };
  }

  /**
   * Finds every active user with an admin/dispatcher role. Used as the
   * recipient set for incident notifications.
   *
   * @returns Array of lightweight user projections (id, name, email).
   */
  private async findOperationsRecipients(): Promise<NotificationRecipient[]> {
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
          or(...ADMIN_DISPATCHER_ROLES.map((role) => eq(users.role, role))),
        ),
      );

    return rows;
  }

  /**
   * Finds recipients for a document-processing notification: every active
   * user with a document-recipient role, plus the uploader (if known) even
   * if their role is not in the recipient list.
   *
   * @param uploadedByUserId - Optional id of the user who uploaded the document.
   * @returns Deduplicated list of recipient projections.
   */
  private async findDocumentRecipients(
    uploadedByUserId?: string | null,
  ): Promise<NotificationRecipient[]> {
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
            ...DOCUMENT_RECIPIENT_ROLES.map((role) => eq(users.role, role)),
            uploadedByUserId ? eq(users.id, uploadedByUserId) : undefined,
          ),
        ),
      );

    return rows;
  }
}
