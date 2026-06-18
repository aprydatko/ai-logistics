/**
 * Single source of truth for user roles in the API.
 *
 * Mirrors the canonical list from `@repo/shared` (`UserRole`) and the
 * Drizzle `userRoleEnum` in `db/schema/users.ts`. Any change here must
 * be reflected in both. Keeping it local to the API avoids adding a
 * dependency on `@repo/shared` just for the role literal set.
 */
export const USER_ROLES = ["admin", "dispatcher", "manager", "driver"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/**
 * Roles allowed to perform back-office / admin actions
 * (e.g. Bull Board dashboard, incident/document management APIs).
 */
export const ADMIN_DISPATCHER_ROLES = [
  "admin",
  "dispatcher",
] as const satisfies readonly UserRole[];

export type AdminDispatcherRole = (typeof ADMIN_DISPATCHER_ROLES)[number];

/**
 * Roles that can receive document-related notifications in addition
 * to the original uploader.
 */
export const DOCUMENT_RECIPIENT_ROLES = [
  "admin",
  "dispatcher",
  "manager",
] as const satisfies readonly UserRole[];

export type DocumentRecipientRole = (typeof DOCUMENT_RECIPIENT_ROLES)[number];

/**
 * Type guard for runtime values (e.g. JWT payload, DB row) that should
 * narrow to {@link UserRole}. Falls back to `false` for unknown values
 * instead of throwing.
 */
export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" &&
  (USER_ROLES as readonly string[]).includes(value);
