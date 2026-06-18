import { Controller, Get } from "@nestjs/common";
import { sql } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import { RedisHealthService } from "./redis-health.service";

interface HealthResponse {
  status: "ok";
  uptime: number;
  timestamp: string;
}

interface DatabaseHealthResponse {
  status: "ok";
  database: "reachable";
}

interface RedisHealthResponse {
  status: "ok";
  redis: "reachable";
}

@Controller("health")
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisHealthService: RedisHealthService,
  ) {}

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

  @Get("redis")
  async getRedisHealth(): Promise<RedisHealthResponse> {
    await this.redisHealthService.ping();

    return {
      status: "ok",
      redis: "reachable",
    };
  }
}
