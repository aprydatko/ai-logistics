import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { eq } from "drizzle-orm";
import type { Request } from "express";

import { DatabaseService } from "../../db/database.service";
import { users } from "../../db/schema";
import type { AccessTokenPayload, AuthenticatedUser } from "./auth.types";

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Validates JWT access token and attaches user to request.
   *
   * Extracts Bearer token from Authorization header, verifies signature
   * and token type, fetches user from database, checks account is active,
   * and attaches user data to request for use in controllers.
   *
   * @param context - NestJS execution context
   * @returns True if authentication succeeds
   * @throws UnauthorizedException if token is missing, invalid, or user is inactive
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException("Access token is required");
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(token);

      if (payload.tokenType !== "access" || !payload.sub) {
        throw new UnauthorizedException("Invalid access token");
      }

      const [user] = await this.databaseService.client
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      if (!user || !user.isActive) {
        throw new UnauthorizedException("Invalid access token");
      }

      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }
  }

  /**
   * Extracts Bearer token from Authorization header.
   *
   * @param request - Express request object
   * @returns Token string or undefined if not found or invalid format
   */
  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];

    return type === "Bearer" ? token : undefined;
  }
}
