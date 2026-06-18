import { Global, Module } from "@nestjs/common";

import { RequestContextService } from "./request-context.service";
import { WinstonLoggerService } from "./winston-logger.service";

@Global()
@Module({
  providers: [RequestContextService, WinstonLoggerService],
  exports: [RequestContextService, WinstonLoggerService],
})
export class LoggingModule {}
