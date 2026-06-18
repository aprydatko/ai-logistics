import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

import { MetricsService } from "../../common/metrics/metrics.service";
import { REDIS_CONNECTION } from "../queue/queue.constants";
import type { RedisConnectionOptions } from "../queue/queue.types";

@Injectable()
export class RedisHealthService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(
    @Inject(REDIS_CONNECTION)
    connection: RedisConnectionOptions,
    private readonly metrics: MetricsService,
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
    try {
      if (this.client.status === "wait") {
        await this.client.connect();
      }

      await this.client.ping();
      this.metrics.setRedisUp(true);

      return "reachable";
    } catch (error) {
      this.metrics.setRedisUp(false);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }
}
