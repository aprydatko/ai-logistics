import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import type { Environment } from "../../config/environment";
import { MetricsService } from "../../common/metrics/metrics.service";
import { REDIS_CONNECTION } from "../queue/queue.constants";
import type { RedisConnectionOptions } from "../queue/queue.types";
import type { CacheNamespace, CacheTtlKind } from "./cache.types";

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(REDIS_CONNECTION)
    connection: RedisConnectionOptions,
    private readonly configService: ConfigService<Environment, true>,
    private readonly metricsService: MetricsService,
  ) {
    this.client = new Redis({
      ...connection,
      lazyConnect: true,
    });
  }

  async getOrSet<T>(
    namespace: CacheNamespace,
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.safeGet<T>(namespace, key);
    if (cached !== undefined) {
      this.metricsService.recordCacheRequest(namespace, "hit");
      return cached;
    }

    this.metricsService.recordCacheRequest(namespace, "miss");

    const value = await factory();
    await this.safeSet(namespace, key, ttlSeconds, value);
    return value;
  }

  getTtl(kind: CacheTtlKind): number {
    const envKeyByKind = {
      list: "CACHE_LIST_TTL_SECONDS",
      detail: "CACHE_DETAIL_TTL_SECONDS",
      metrics: "CACHE_METRICS_TTL_SECONDS",
    } as const;

    return this.configService.get(envKeyByKind[kind], { infer: true });
  }

  async invalidateNamespace(namespace: CacheNamespace): Promise<void> {
    let cursor = "0";
    const pattern = `${namespace}:*`;

    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        "100",
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } while (cursor !== "0");
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  private async safeGet<T>(
    namespace: CacheNamespace,
    key: string,
  ): Promise<T | undefined> {
    try {
      const value = await this.client.get(key);
      if (!value) return undefined;
      return JSON.parse(value) as T;
    } catch (error: unknown) {
      this.metricsService.recordCacheRequest(namespace, "read_error");
      this.logger.warn(
        `Cache read failed for key "${key}": ${this.toErrorMessage(error)}`,
      );
      return undefined;
    }
  }

  private async safeSet<T>(
    namespace: CacheNamespace,
    key: string,
    ttlSeconds: number,
    value: T,
  ): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (error: unknown) {
      this.metricsService.recordCacheRequest(namespace, "write_error");
      this.logger.warn(
        `Cache write failed for key "${key}": ${this.toErrorMessage(error)}`,
      );
    }
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return "Unknown cache error";
  }
}
