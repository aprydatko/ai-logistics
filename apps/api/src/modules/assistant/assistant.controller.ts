import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { rateLimitConfig } from "../../config/rate-limit";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AssistantService } from "./assistant.service";
import type { AssistantResponseDto } from "./dto/create-assistant-message.dto";
import { CreateAssistantMessageDto } from "./dto/create-assistant-message.dto";

@Controller("assistant")
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post()
  @Throttle({ default: rateLimitConfig.assistantRespond })
  respond(
    @Body() dto: CreateAssistantMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AssistantResponseDto> {
    return this.assistantService.respond(dto, user);
  }
}
