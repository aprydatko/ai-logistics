import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import compression from "compression";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { createRequestContextMiddleware } from "./common/logging/request-context.middleware";
import { createRequestLoggingMiddleware } from "./common/logging/request-logging.middleware";
import { RequestContextService } from "./common/logging/request-context.service";
import { SentryService } from "./common/logging/sentry.service";
import { WinstonLoggerService } from "./common/logging/winston-logger.service";
import { MetricsService } from "./common/metrics/metrics.service";
import type { Environment } from "./config/environment";
import { createCorsOptions, createHelmetOptions } from "./config/security";
import { QueueDashboardAuthService } from "./modules/queue/queue-dashboard-auth.service";
import { QueueDashboardService } from "./modules/queue/queue-dashboard.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService<Environment, true>);
  const logger = app.get(WinstonLoggerService);
  const requestContext = app.get(RequestContextService);
  const sentry = app.get(SentryService);
  const metrics = app.get(MetricsService);

  app.useLogger(logger);

  app.setGlobalPrefix("api");
  app.useBodyParser("json", { limit: "7mb" });
  app.use(compression({ threshold: 1024 }));
  app.use(
    helmet(
      createHelmetOptions(
        configService.get("NODE_ENV", { infer: true }) === "production",
      ),
    ),
  );
  app.use(createRequestContextMiddleware(requestContext));
  app.use(createRequestLoggingMiddleware(logger, requestContext, metrics));
  app.enableCors(createCorsOptions());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  const queueDashboardService = app.get(QueueDashboardService);
  const queueDashboardAuthService = app.get(QueueDashboardAuthService);
  app.use(
    queueDashboardService.basePath,
    queueDashboardAuthService.createMiddleware(),
    queueDashboardService.getRouter(),
  );

  process.on("unhandledRejection", (reason) => {
    logger.errorWithMeta("Unhandled promise rejection", reason, {
      context: "bootstrap",
      event: "process_unhandled_rejection",
    });
    sentry.captureException(reason, {
      tags: {
        area: "process",
        type: "unhandledRejection",
      },
    });
  });

  process.on("uncaughtException", (error) => {
    logger.errorWithMeta("Uncaught exception", error, {
      context: "bootstrap",
      event: "process_uncaught_exception",
    });
    sentry.captureException(error, {
      tags: {
        area: "process",
        type: "uncaughtException",
      },
    });
  });

  await app.listen(configService.get("API_PORT", { infer: true }));
}

void bootstrap();
