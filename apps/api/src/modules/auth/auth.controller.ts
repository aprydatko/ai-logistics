import { Body, Controller, Post } from "@nestjs/common";

import {
  AuthService,
  type LoginResponse,
  type PublicUser,
} from "./auth.service";
import { LoginDto, RegisterDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }
}
