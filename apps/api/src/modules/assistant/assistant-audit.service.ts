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

  async logAssistantCall(payload: CreateAiLogDto): Promise<void> {
    try {
      await this.aiLogsService.create(payload);
    } catch {
      // Logging should not break assistant responses.
    }
  }
}
