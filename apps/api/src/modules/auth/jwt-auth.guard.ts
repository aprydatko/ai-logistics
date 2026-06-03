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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException("Access token is required");
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
      );

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

  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];

    return type === "Bearer" ? token : undefined;
  }
}
