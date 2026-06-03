import { Controller, Get } from "@nestjs/common";
import { sql } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";

interface HealthResponse {
  status: "ok";
  uptime: number;
  timestamp: string;
}

interface DatabaseHealthResponse {
  status: "ok";
  database: "reachable";
}

@Controller("health")
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  getHealth(): HealthResponse {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get("db")
  async getDatabaseHealth(): Promise<DatabaseHealthResponse> {
    await this.databaseService.client.execute(sql`select 1`);

    return {
      status: "ok",
      database: "reachable",
    };
  }
}
