import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CONNECTION } from "../queue/queue.constants";
import type { RedisConnectionOptions } from "../queue/queue.types";

@Injectable()
export class RedisHealthService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(
    @Inject(REDIS_CONNECTION)
    connection: RedisConnectionOptions,
  ) {
    this.client = new Redis({
      db: connection.db,
      host: connection.host,
      password: connection.password,
      port: connection.port,
      username: connection.username,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async ping(): Promise<"reachable"> {
    await this.client.connect();
    await this.client.ping();

    return "reachable";
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }
}
