import type { NextFunction, Request, Response } from "express";

import type { AuthenticatedUser } from "../../modules/auth/auth.types";
import { RequestContextService } from "./request-context.service";
import { WinstonLoggerService } from "./winston-logger.service";

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
  route?: {
    path?: string;
  };
};

export const createRequestLoggingMiddleware =
  (
    logger: WinstonLoggerService,
    requestContext: RequestContextService,
  ) =>
  (request: Request, response: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();

    response.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const authenticatedRequest = request as AuthenticatedRequest;
      const userId = authenticatedRequest.user?.id;

      requestContext.setUserId(userId);
      logger.logHttpRequest({
        durationMs,
        method: request.method,
        path: request.originalUrl || request.url,
        route: authenticatedRequest.route?.path,
        statusCode: response.statusCode,
        userId,
      });
    });

    next();
  };
