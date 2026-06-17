import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

import { DatabaseService } from "../../db/database.service";
import { users } from "../../db/schema";
import type { AccessTokenPayload } from "../auth/auth.types";

@Injectable()
export class QueueDashboardAuthService {
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
      try {
        const token = this.extractToken(request);
        if (!token) throw new Error("Missing token");

        const payload =
          await this.jwtService.verifyAsync<AccessTokenPayload>(token);

        if (payload.tokenType !== "access" || !payload.sub) {
          throw new Error("Invalid token");
        }

        const [user] = await this.databaseService.client
          .select({
            id: users.id,
            isActive: users.isActive,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, payload.sub))
          .limit(1);

        if (!user || !user.isActive) throw new Error("Inactive user");
        if (user.role !== "admin" && user.role !== "dispatcher") {
          throw new Error("Forbidden");
        }

        next();
      } catch {
        response.status(401).json({ message: "Unauthorized" });
      }
    };
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    if (type === "Bearer" && token) return token;

    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return undefined;

    return cookieHeader
      .split(";")
      .map((chunk) => chunk.trim())
      .find((chunk) => chunk.startsWith("access_token="))
      ?.slice("access_token=".length);
  }
}
