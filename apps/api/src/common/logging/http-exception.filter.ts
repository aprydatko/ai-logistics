import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

import { REQUEST_ID_HEADER } from "./logging.constants";
import { SentryService } from "./sentry.service";
import { WinstonLoggerService } from "./winston-logger.service";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: WinstonLoggerService,
    private readonly sentry: SentryService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.resolveMessage(exception);
    const requestId =
      response.getHeader(REQUEST_ID_HEADER)?.toString() ??
      request.headers[REQUEST_ID_HEADER]?.toString();

    this.logger.errorWithMeta("Unhandled HTTP exception", exception, {
      context: HttpExceptionFilter.name,
      event: "http_exception",
      method: request.method,
      path: request.originalUrl || request.url,
      requestId,
      statusCode,
    });

    this.sentry.captureException(exception, {
      requestId,
      tags: {
        area: "http",
        method: request.method,
        route: request.route?.path ?? request.path,
        statusCode: String(statusCode),
      },
      user: this.extractUser(request),
    });

    if (response.headersSent) {
      return;
    }

    response.status(statusCode).json({
      message,
      statusCode,
      ...(requestId ? { requestId } : {}),
    });
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (
        typeof response === "object" &&
        response !== null &&
        "message" in response
      ) {
        const message = (response as { message?: unknown }).message;

        if (typeof message === "string") return message;
        if (Array.isArray(message)) return message.join(", ");
      }

      return exception.message;
    }

    return "Internal server error";
  }

  private extractUser(
    request: Request,
  ): { email?: string; id?: string; username?: string } | undefined {
    const candidate = request as Request & {
      user?: { email?: string; id?: string };
    };

    if (!candidate.user?.id) {
      return undefined;
    }

    return {
      email: candidate.user.email,
      id: candidate.user.id,
      username: candidate.user.email,
    };
  }
}
