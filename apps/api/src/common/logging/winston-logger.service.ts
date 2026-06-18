import { Injectable, LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createLogger, format, transports, type Logger } from "winston";

import type { Environment } from "../../config/environment";
import { API_SERVICE_NAME } from "./logging.constants";
import type { LogMeta } from "./logging.types";
import { RequestContextService } from "./request-context.service";

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private readonly logger: Logger;
  private readonly environment: Environment["NODE_ENV"];

  constructor(
    configService: ConfigService<Environment, true>,
    private readonly requestContext: RequestContextService,
  ) {
    this.environment = configService.get("NODE_ENV", { infer: true });
    const logLevel = configService.get("LOG_LEVEL", { infer: true });

    this.logger = createLogger({
      defaultMeta: {
        environment: this.environment,
        service: API_SERVICE_NAME,
      },
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
      ),
      level: logLevel,
      transports: [new transports.Console()],
    });
  }

  log(message: unknown, context?: string): void {
    this.write("info", message, { context });
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write("error", message, { context, stack: trace });
  }

  warn(message: unknown, context?: string): void {
    this.write("warn", message, { context });
  }

  warnWithMeta(message: unknown, meta?: LogMeta): void {
    this.write("warn", message, meta);
  }

  debug(message: unknown, context?: string): void {
    this.write("debug", message, { context });
  }

  debugWithMeta(message: unknown, meta?: LogMeta): void {
    this.write("debug", message, meta);
  }

  verbose(message: unknown, context?: string): void {
    this.write("verbose", message, { context });
  }

  fatal(message: unknown, trace?: string, context?: string): void {
    this.write("error", message, { context, stack: trace });
  }

  info(message: unknown, meta?: LogMeta): void {
    this.write("info", message, meta);
  }

  errorWithMeta(message: unknown, error: unknown, meta?: LogMeta): void {
    const normalizedError =
      error instanceof Error
        ? {
            errorName: error.name,
            stack: error.stack,
          }
        : {
            error: error,
          };

    this.write("error", message, {
      ...normalizedError,
      ...meta,
    });
  }

  logHttpRequest(meta: LogMeta): void {
    this.write("info", "HTTP request completed", {
      event: "http_request_completed",
      ...meta,
    });
  }

  private write(level: string, message: unknown, meta: LogMeta = {}): void {
    const normalized = this.normalizeMessage(message);
    const contextStore = this.requestContext.getStore();

    this.logger.log({
      ...this.cleanMeta({
        ...normalized.meta,
        ...meta,
        requestId: meta.requestId ?? contextStore?.requestId,
        userId: meta.userId ?? contextStore?.userId,
      }),
      level,
      message: normalized.message,
    });
  }

  private normalizeMessage(message: unknown): {
    message: string;
    meta?: LogMeta;
  } {
    if (message instanceof Error) {
      return {
        message: message.message,
        meta: {
          errorName: message.name,
          stack: message.stack,
        },
      };
    }

    if (typeof message === "string") {
      return { message };
    }

    return {
      message: "Structured log",
      meta: {
        payload: message,
      },
    };
  }

  private cleanMeta(meta: LogMeta): LogMeta {
    const result: LogMeta = {};

    for (const [key, value] of Object.entries(meta)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }

    return result;
  }
}
