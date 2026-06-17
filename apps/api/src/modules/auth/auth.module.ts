import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import type { Environment } from "../../config/environment";
import { AuthenticatedThrottlerGuard } from "./authenticated-throttler.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Environment, true>) => ({
        secret: configService.get("JWT_ACCESS_SECRET", { infer: true }),
        signOptions: {
          expiresIn: configService.get("JWT_ACCESS_EXPIRES_IN", {
            infer: true,
          }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    AuthenticatedThrottlerGuard,
  ],
  exports: [
    JwtModule,
    JwtAuthGuard,
    RolesGuard,
    AuthenticatedThrottlerGuard,
  ],
})
export class AuthModule {}
