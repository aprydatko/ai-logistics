import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AuthService } from "./auth.service";
import type {
  AuthenticatedUser,
  LoginResponse,
  PublicUser,
} from "./auth.types";
import { CurrentUser } from "./current-user.decorator";
import { LoginDto, RefreshTokenDto, RegisterDto } from "./dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<LoginResponse> {
    return this.authService.refresh(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

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
