import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { NextFunction, Request, Response } from "express";

import { WinstonLoggerService } from "../../common/logging/winston-logger.service";
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
  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
    private readonly logger: WinstonLoggerService,
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
          this.logger.warnWithMeta(message, {
            context: QueueDashboardAuthService.name,
            event: "queue_dashboard_access_denied",
            path: request.originalUrl || request.url,
          });
        } else {
          this.logger.debugWithMeta(message, {
            context: QueueDashboardAuthService.name,
            event: "queue_dashboard_access_denied",
            path: request.originalUrl || request.url,
          });
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
      this.logger.info("Queue dashboard access granted", {
        context: QueueDashboardAuthService.name,
        event: "queue_dashboard_access_granted",
        path: request.originalUrl || request.url,
        userId: user.id,
      });
    };
  }
}
