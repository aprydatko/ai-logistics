import type {
  Notification,
  NotificationChannel,
  NotificationPreference,
} from "@repo/shared/src";
import type { Queue } from "bullmq";
import { notifications } from "../../../db/schema";
import type { EmailNotificationJobData } from "../../queue/queue.types";
import type {
  CreateNotificationInput,
  NotificationRecipient,
} from "../notifications.types";
import type { NotificationRecord } from "../../../db/schema";
import { toNotification } from "./notification.mapper";

/**
 * Drizzle database client. Typed structurally (instead of pulling in the
 * concrete `NodePgDatabase` type) so the dispatcher stays decoupled from
 * the concrete driver — the only methods it relies on are `insert(...).values(...).returning()`.
 */
type DatabaseClient = {
  insert: (table: typeof notifications) => {
    values: (values: unknown) => {
      returning: () => Promise<NotificationRecord[]>;
    };
  };
};

/**
 * Pure-function dependencies required to dispatch a notification. Captured
 * once at the call site (where the Nest-injected services live) and passed
 * in so the dispatcher itself stays a free function — easier to unit-test
 * and to reuse from other services (e.g. the email worker) in the future.
 */
export type DispatcherDeps = {
  client: DatabaseClient;
  emailQueue: Queue<EmailNotificationJobData>;
  emitDashboardIncidentStats: (userId: string) => void;
  emitNotificationCreated: (userId: string, notification: Notification) => void;
  emitUnreadCountUpdated: (userId: string, unreadCount: number) => void;
  getUnreadCount: (
    userId: string,
  ) => Promise<{ data: { unreadCount: number } }>;
};

/**
 * The subset of fields the dispatcher needs to persist a notification row.
 * Mirrors the public DTO minus id/timestamps (DB defaults) and the userId
 * (which the dispatcher sets from the recipient).
 */
export type DispatchNotificationBase = {
  category: CreateNotificationInput["category"];
  entityId: string | null;
  entityType: "incident" | null;
  href: string | null;
  message: string;
  title: string;
  type: CreateNotificationInput["type"];
};

/**
 * Options accepted by {@link dispatchNotification}.
 */
export type DispatchNotificationOptions = {
  base: DispatchNotificationBase;
  channels: NotificationChannel[];
  emitDashboardIncidentStats: boolean;
  payload: CreateNotificationInput["payload"];
  preference: NotificationPreference;
};

/**
 * Persists a notification row for a single recipient, fans it out via
 * realtime, and optionally enqueues an email job.
 *
 * Returns the persisted notification as a public DTO, or `null` when no
 * row was created (caller passed an empty channel list or the database
 * insert returned no row — both are no-ops the caller should treat as
 * "recipient skipped").
 */
export async function dispatchNotification(
  recipient: NotificationRecipient,
  deps: DispatcherDeps,
  options: DispatchNotificationOptions,
): Promise<ReturnType<typeof toNotification> | null> {
  if (options.channels.length === 0) return null;

  const [created] = await deps.client
    .insert(notifications)
    .values({
      userId: recipient.id,
      category: options.base.category,
      type: options.base.type,
      channels: options.channels,
      title: options.base.title,
      message: options.base.message,
      entityType: options.base.entityType,
      entityId: options.base.entityId,
      href: options.base.href,
      payload: options.payload,
    })
    .returning();

  if (!created) return null;

  const notification = toNotification(created);
  deps.emitNotificationCreated(recipient.id, notification);

  const unreadCount = await deps.getUnreadCount(recipient.id);
  deps.emitUnreadCountUpdated(recipient.id, unreadCount.data.unreadCount);

  if (options.emitDashboardIncidentStats) {
    deps.emitDashboardIncidentStats(recipient.id);
  }

  if (options.channels.includes("email")) {
    await deps.emailQueue.add(
      "send-notification-email",
      {
        channels: options.channels,
        notification,
        preference: options.preference,
        recipient,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2_000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );
  }

  return notification;
}

/**
 * Computes the active channels for a recipient given their preferences
 * and an optional `forceInApp` override (used to guarantee the uploader
 * sees their own document-processing result).
 *
 * @param options - Per-channel enable flags and optional force flag.
 * @returns Filtered list with stable ordering: in_app first, email second.
 */
export function resolveChannels(options: {
  emailEnabled: boolean;
  forceInApp?: boolean;
  inAppEnabled: boolean;
}): NotificationChannel[] {
  return [
    options.inAppEnabled || options.forceInApp ? "in_app" : null,
    options.emailEnabled ? "email" : null,
  ].filter((value): value is NotificationChannel => Boolean(value));
}
