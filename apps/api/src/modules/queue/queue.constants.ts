import type { AdminDispatcherRole, UserRole } from '../../common/roles';
import { ADMIN_DISPATCHER_ROLES } from '../../common/roles';

export const AI_PROCESSING_QUEUE = 'ai-processing';
export const DOCUMENT_PROCESSING_QUEUE = 'document-processing';
export const EMAIL_NOTIFICATIONS_QUEUE = 'email-notifications';

export const REDIS_CONNECTION = 'REDIS_CONNECTION';
export const AI_PROCESSING_QUEUE_TOKEN = 'AI_PROCESSING_QUEUE_TOKEN';
export const DOCUMENT_PROCESSING_QUEUE_TOKEN =
  'DOCUMENT_PROCESSING_QUEUE_TOKEN';
export const EMAIL_NOTIFICATIONS_QUEUE_TOKEN =
  'EMAIL_NOTIFICATIONS_QUEUE_TOKEN';

export const QUEUE_DEFINITIONS = [
  [AI_PROCESSING_QUEUE_TOKEN, AI_PROCESSING_QUEUE],
  [DOCUMENT_PROCESSING_QUEUE_TOKEN, DOCUMENT_PROCESSING_QUEUE],
  [EMAIL_NOTIFICATIONS_QUEUE_TOKEN, EMAIL_NOTIFICATIONS_QUEUE],
] as const satisfies ReadonlyArray<readonly [string, string]>;

export const QUEUE_DASHBOARD_ROLES: ReadonlySet<UserRole> = new Set(
  ADMIN_DISPATCHER_ROLES
);

export type QueueDashboardRole = AdminDispatcherRole;

export type BullMaxRetriesPerRequest = number | null;
export const BULLMQ_MAX_RETRIES_PER_REQUEST: null = null;
