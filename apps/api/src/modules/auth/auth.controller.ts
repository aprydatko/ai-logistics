import { Body, Controller, Post } from "@nestjs/common";

import { AuthService, type PublicUser } from "./auth.service";
import { RegisterDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.authService.register(dto);
  }
}
