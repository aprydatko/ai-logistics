import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { Environment } from "../config/environment";
import * as schema from "./schema";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  readonly client: NodePgDatabase<typeof schema>;

  constructor(configService: ConfigService<Environment, true>) {
    this.pool = new Pool({
      connectionString: configService.get("DATABASE_URL", { infer: true }),
    });
    this.client = drizzle(this.pool, { schema });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
