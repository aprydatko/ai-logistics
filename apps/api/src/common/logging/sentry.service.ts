import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRequire } from "node:module";

import type { Environment } from "../../config/environment";
import { API_SERVICE_NAME } from "./logging.constants";
import { RequestContextService } from "./request-context.service";

type CaptureExceptionOptions = {
  extra?: Record<string, unknown>;
  requestId?: string;
  tags?: Record<string, string>;
  user?: {
    email?: string;
    id?: string;
    username?: string;
  };
};

type SentryScope = {
  setContext: (name: string, context: Record<string, unknown>) => void;
  setExtra: (key: string, extra: unknown) => void;
  setTag: (key: string, value: string) => void;
  setUser: (user: { email?: string; id?: string; username?: string }) => void;
};

type SentryClient = {
  captureException: (error: Error) => void;
  init: (options: {
    dsn?: string;
    environment: string;
    initialScope: {
      tags: Record<string, string>;
    };
    tracesSampleRate: number;
  }) => void;
  isInitialized: () => boolean;
  withScope: (callback: (scope: SentryScope) => void) => void;
};

const loadSentry = (): SentryClient => {
  const localRequire = createRequire(__filename);
  return localRequire("@sentry/node") as SentryClient;
};

@Injectable()
export class SentryService {
  private readonly enabled: boolean;
  private readonly sentry: SentryClient | null;

  constructor(
    configService: ConfigService<Environment, true>,
    private readonly requestContext: RequestContextService,
  ) {
    const dsn = configService.get("SENTRY_DSN", { infer: true });
    const environment =
      configService.get("SENTRY_ENVIRONMENT", { infer: true }) ??
      configService.get("NODE_ENV", { infer: true });
    const tracesSampleRate = configService.get("SENTRY_TRACES_SAMPLE_RATE", {
      infer: true,
    });

    this.enabled = Boolean(dsn);
    this.sentry = this.enabled ? loadSentry() : null;

    if (!this.enabled) {
      return;
    }

    if (this.sentry && !this.sentry.isInitialized()) {
      this.sentry.init({
        dsn,
        environment: environment ?? "development",
        initialScope: {
          tags: {
            service: API_SERVICE_NAME,
          },
        },
        tracesSampleRate,
      });
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  captureException(
    error: unknown,
    options: CaptureExceptionOptions = {},
  ): void {
    if (!this.enabled || !this.sentry) {
      return;
    }

    const requestId =
      options.requestId ?? this.requestContext.getStore()?.requestId;

    this.sentry.withScope((scope: SentryScope) => {
      if (requestId) {
        scope.setTag("request_id", requestId);
        scope.setContext("request", { requestId });
      }

      if (options.tags) {
        for (const [key, value] of Object.entries(options.tags)) {
          scope.setTag(key, value);
        }
      }

      if (options.user) {
        scope.setUser(options.user);
      }

      if (options.extra) {
        for (const [key, value] of Object.entries(options.extra)) {
          scope.setExtra(key, value);
        }
      }

      const sentry = this.sentry;
      if (!sentry) {
        return;
      }

      sentry.captureException(
        error instanceof Error ? error : new Error(String(error)),
      );
    });
  }
}
