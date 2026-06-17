import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import { users } from "../../db/schema";
import { AiLogsService } from "../ai-logs/ai-logs.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import type { CreateAiLogDto } from "./internal/assistant.types";

@Injectable()
export class AssistantAuditService {
  constructor(
    private readonly aiLogsService: AiLogsService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Retrieves the display name for a user from the database.
   * Falls back to email if name is not available.
   *
   * @param user - The authenticated user
   * @returns Promise resolving to the user's display name
   */
  async getUserDisplayName(user: AuthenticatedUser): Promise<string> {
    const [dbUser] = await this.databaseService.client
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser) {
      return user.email;
    }

    const fullName = `${dbUser.firstName} ${dbUser.lastName}`.trim();
    return fullName || user.email;
  }

  /**
   * Logs an assistant call to the AI logs service.
   * Errors are silently ignored to prevent breaking assistant responses.
   *
   * @param payload - The log payload with call details
   */
  async logAssistantCall(payload: CreateAiLogDto): Promise<void> {
    try {
      await this.aiLogsService.create(payload);
    } catch {
      // Logging should not break assistant responses.
    }
  }
}
