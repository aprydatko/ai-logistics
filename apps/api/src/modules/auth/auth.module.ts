import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import type { Environment } from "../../config/environment";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Environment, true>) => ({
        secret: configService.get("JWT_ACCESS_SECRET", { infer: true }),
        signOptions: {
          expiresIn: configService.get("JWT_ACCESS_EXPIRES_IN", { infer: true }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
