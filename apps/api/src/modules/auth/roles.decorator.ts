import { SetMetadata } from "@nestjs/common";

import type { UserRecord } from "../../db/schema";

/**
 * Metadata key used by RolesGuard to retrieve required roles.
 */
export const ROLES_KEY = "roles";

/**
 * Decorator to specify required roles for a route handler or controller.
 *
 * Used in conjunction with RolesGuard to enforce role-based access control.
 * Can be applied at both method and class level.
 *
 * @example
 * ```ts
 * @Roles('admin', 'dispatcher')
 * @Get('admin-only')
 * adminOnly() { ... }
 * ```
 *
 * @param roles - Array of allowed roles
 * @returns Method and class decorator
 */
export const Roles = (
  ...roles: UserRecord["role"][]
): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);
