import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

import { DatabaseService } from "../../db/database.service";
import {
  extractAccessToken,
  findActiveUserById,
  isAccessTokenPayload,
} from "./auth.helpers";
import type { AuthenticatedUser } from "./auth.types";

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
    const token = extractAccessToken(request);

    if (!token) {
      throw new UnauthorizedException("Access token is required");
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (!isAccessTokenPayload(payload)) {
        throw new UnauthorizedException("Invalid access token");
      }

      const user = await findActiveUserById(this.databaseService, payload.sub);

      if (!user) {
        throw new UnauthorizedException("Invalid access token");
      }

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid access token");
    }
  }
}
