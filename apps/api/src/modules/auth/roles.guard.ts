import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import type { UserRecord } from "../../db/schema";
import type { AuthenticatedUser } from "./auth.types";
import { ROLES_KEY } from "./roles.decorator";

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Validates that the authenticated user has required roles.
   *
   * Checks the @Roles() decorator on both the handler and class level.
   * If no roles are specified, allows access. Otherwise, verifies
   * the user's role is in the required roles list.
   *
   * @param context - NestJS execution context
   * @returns True if user has required roles or no roles specified
   * @throws ForbiddenException if user lacks required permissions
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      UserRecord["role"][]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
