import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "./auth.types";

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Parameter decorator to extract the authenticated user from the request.
 *
 * Must be used in conjunction with JwtAuthGuard. Throws an error if
 * no user is attached to the request (guard not applied).
 *
 * @example
 * ```ts
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new Error("CurrentUser can only be used with JwtAuthGuard");
    }

    return request.user;
  },
);
