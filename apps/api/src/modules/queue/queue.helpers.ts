import { Provider } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  BULLMQ_MAX_RETRIES_PER_REQUEST,
  REDIS_CONNECTION,
} from "./queue.constants";
import type { RedisConnectionOptions } from "./queue.types";

export const parseRedisUrl = (redisUrl: string): RedisConnectionOptions => {
  const url = new URL(redisUrl);

  return {
    db: url.pathname ? Number(url.pathname.slice(1) || "0") : 0,
    host: url.hostname,
    maxRetriesPerRequest: BULLMQ_MAX_RETRIES_PER_REQUEST,
    password: url.password || undefined,
    port: Number(url.port || "6379"),
    username: url.username || undefined,
  };
};

export const createQueueProvider = (token: string, name: string): Provider => ({
  inject: [REDIS_CONNECTION],
  provide: token,
  useFactory: (connection: RedisConnectionOptions) =>
    new Queue(name, { connection }),
});
