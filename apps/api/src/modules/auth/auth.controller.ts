import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { rateLimitConfig } from "../../config/rate-limit";
import { AuthService } from "./auth.service";
import type {
  AuthenticatedUser,
  LoginResponse,
  PublicUser,
  SocketTokenResponse,
} from "./auth.types";
import { CurrentUser } from "./current-user.decorator";
import { LoginDto, RefreshTokenDto, RegisterDto } from "./dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register - Registers a new user account.
   *
   * @param dto - User registration payload
   * @returns Created user without sensitive data
   */
  @Post("register")
  @Throttle({ default: rateLimitConfig.authRegister })
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login - Authenticates a user and returns tokens.
   *
   * @param dto - Login credentials
   * @returns Access token, refresh token, and user data
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: rateLimitConfig.authLogin })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/refresh - Refreshes access tokens using a refresh token.
   *
   * @param dto - Refresh token payload
   * @returns New access token, refresh token, and user data
   */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: rateLimitConfig.authRefresh })
  refresh(@Body() dto: RefreshTokenDto): Promise<LoginResponse> {
    return this.authService.refresh(dto);
  }

  /**
   * GET /auth/me - Returns the currently authenticated user.
   *
   * Requires valid JWT access token.
   *
   * @param user - Authenticated user from JWT guard
   * @returns Current user data
   */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  /**
   * POST /auth/socket-token - Creates a short-lived token for WebSocket authentication.
   *
   * Requires valid JWT access token. Socket tokens expire in 2 minutes.
   *
   * @param user - Authenticated user from JWT guard
   * @returns Socket token and expiration timestamp
   */
  @Post("socket-token")
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: rateLimitConfig.authSocketToken })
  createSocketToken(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SocketTokenResponse> {
    return this.authService.createSocketToken(user);
  }

  /**
   * GET /auth/operations - Returns operations access confirmation.
   *
   * Requires admin or dispatcher role. Used to verify role-based access.
   *
   * @param user - Authenticated user from JWT guard
   * @returns Confirmation message and user data
   */
  @Get("operations")
  @Roles("admin", "dispatcher")
  @UseGuards(JwtAuthGuard, RolesGuard)
  getOperationsAccess(@CurrentUser() user: AuthenticatedUser): {
    message: string;
    user: AuthenticatedUser;
  } {
    return {
      message: "Operations access granted",
      user,
    };
  }
}
