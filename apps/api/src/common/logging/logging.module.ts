import { Global, Module } from "@nestjs/common";

import { APP_FILTER } from "@nestjs/core";

import { HttpExceptionFilter } from "./http-exception.filter";
import { RequestContextService } from "./request-context.service";
import { SentryService } from "./sentry.service";
import { WinstonLoggerService } from "./winston-logger.service";

@Global()
@Module({
  providers: [
    RequestContextService,
    WinstonLoggerService,
    SentryService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [RequestContextService, WinstonLoggerService, SentryService],
})
export class LoggingModule {}
