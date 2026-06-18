import { describe, expect, it, vi } from "vitest";

import { RedisHealthService } from "./redis-health.service";

type MockRedisClient = {
  connect: ReturnType<typeof vi.fn>;
  ping: ReturnType<typeof vi.fn>;
  quit: ReturnType<typeof vi.fn>;
  status: string;
};

type MetricsMock = {
  setRedisUp: ReturnType<typeof vi.fn>;
};

const buildService = (
  client: MockRedisClient,
): { metrics: MetricsMock; service: RedisHealthService } => {
  const service = Object.create(
    RedisHealthService.prototype,
  ) as RedisHealthService;
  const metrics: MetricsMock = {
    setRedisUp: vi.fn(),
  };

  Reflect.set(service, "client", client);
  Object.defineProperty(service, "metrics", {
    value: metrics,
    configurable: true,
    enumerable: true,
    writable: true,
  });

  return {
    metrics,
    service,
  };
};

describe("RedisHealthService", () => {
  it("connects and pings when the client has not connected yet", async () => {
    const client: MockRedisClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue("PONG"),
      quit: vi.fn().mockResolvedValue("OK"),
      status: "wait",
    };
    const { service, metrics } = buildService(client);

    await expect(service.ping()).resolves.toBe("reachable");

    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(client.ping).toHaveBeenCalledTimes(1);
    expect(metrics.setRedisUp).toHaveBeenCalledWith(true);
  });

  it("reuses the existing connection for repeated health checks", async () => {
    const client: MockRedisClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue("PONG"),
      quit: vi.fn().mockResolvedValue("OK"),
      status: "ready",
    };
    const { service, metrics } = buildService(client);

    await expect(service.ping()).resolves.toBe("reachable");

    expect(client.connect).not.toHaveBeenCalled();
    expect(client.ping).toHaveBeenCalledTimes(1);
    expect(metrics.setRedisUp).toHaveBeenCalledWith(true);
  });

  it("marks redis down when ping fails", async () => {
    const error = new Error("redis unavailable");
    const client: MockRedisClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockRejectedValue(error),
      quit: vi.fn().mockResolvedValue("OK"),
      status: "ready",
    };
    const { service, metrics } = buildService(client);

    await expect(service.ping()).rejects.toThrow(error);

    expect(metrics.setRedisUp).toHaveBeenCalledWith(false);
  });
});
