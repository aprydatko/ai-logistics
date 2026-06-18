import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { NextFunction, Request, Response } from "express";

import { isUserRole } from "../../common/roles";
import { DatabaseService } from "../../db/database.service";
import {
  extractAccessToken,
  findActiveUserById,
  isAccessTokenPayload,
} from "../auth/auth.helpers";
import { QUEUE_DASHBOARD_ROLES } from "./queue.constants";

@Injectable()
export class QueueDashboardAuthService {
  private readonly logger = new Logger(QueueDashboardAuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) {}

  createMiddleware() {
    return async (
      request: Request,
      response: Response,
      next: NextFunction,
    ): Promise<void> => {
      let denied = false;
      const deny = (reason: string, level: "warn" | "debug" = "debug") => {
        const message = `Denied queue dashboard access: ${reason}`;
        if (level === "warn") {
          this.logger.warn(message);
        } else {
          this.logger.debug(message);
        }
        response.status(401).json({ message: "Unauthorized" });
        denied = true;
      };

      const token = extractAccessToken(request);
      if (!token) {
        deny("missing or malformed token", "warn");
        return;
      }

      const payload = await this.jwtService
        .verifyAsync(token)
        .catch(() => null);

      if (!payload || !isAccessTokenPayload(payload)) {
        deny("invalid or expired token payload", "warn");
        return;
      }

      const user = await findActiveUserById(
        this.databaseService,
        payload.sub,
      ).catch((error: unknown) => {
        deny(
          `unexpected error: ${error instanceof Error ? error.message : "unknown"}`,
          "warn",
        );
        return undefined;
      });

      if (denied) return;
      if (!user) {
        deny("token references unknown user", "warn");
        return;
      }
      if (!isUserRole(user.role) || !QUEUE_DASHBOARD_ROLES.has(user.role)) {
        deny(`role '${user.role}' is not allowed for the queue dashboard`);
        return;
      }

      next();
    };
  }
}
