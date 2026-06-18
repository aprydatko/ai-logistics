import { Injectable } from "@nestjs/common";
import { createRequire } from "node:module";

type LabelValues = Record<string, string>;

type CounterLike = {
  inc: (labels: LabelValues, value?: number) => void;
};

type GaugeLike = {
  set: (value: number) => void;
};

type HistogramLike = {
  observe: (labels: LabelValues, value: number) => void;
};

type GaugeConfig = {
  collect?: (this: GaugeLike) => void;
  help: string;
  name: string;
  registers: RegistryLike[];
};

type MetricConfig = {
  help: string;
  labelNames?: readonly string[];
  name: string;
  buckets?: number[];
  registers: RegistryLike[];
};

type RegistryLike = {
  contentType: string;
  metrics: () => Promise<string>;
};

type PromClientModule = {
  Counter: new (config: MetricConfig) => CounterLike;
  Gauge: new (config: GaugeConfig) => GaugeLike;
  Histogram: new (config: MetricConfig) => HistogramLike;
  Registry: new () => RegistryLike;
  collectDefaultMetrics: (options: {
    prefix?: string;
    register: RegistryLike;
  }) => void;
};

const loadPromClient = (): PromClientModule => {
  const localRequire = createRequire(__filename);
  return localRequire("prom-client") as PromClientModule;
};

const { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } =
  loadPromClient();

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  private readonly httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests handled by the API",
    labelNames: ["method", "route", "status_code"] as const,
    registers: [this.registry],
  });

  private readonly httpErrorsTotal = new Counter({
    name: "http_errors_total",
    help: "Total number of HTTP error responses handled by the API",
    labelNames: ["method", "route", "status_code"] as const,
    registers: [this.registry],
  });

  private readonly httpRequestDurationSeconds = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"] as const,
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
    registers: [this.registry],
  });

  private readonly queueJobsTotal = new Counter({
    name: "queue_jobs_total",
    help: "Total number of processed queue jobs by queue and outcome",
    labelNames: ["queue", "status"] as const,
    registers: [this.registry],
  });

  private readonly assistantRequestsTotal = new Counter({
    name: "assistant_requests_total",
    help: "Total assistant requests by status, model, and operation",
    labelNames: ["status", "model", "operation"] as const,
    registers: [this.registry],
  });

  private readonly assistantRequestDurationSeconds = new Histogram({
    name: "assistant_request_duration_seconds",
    help: "Assistant request duration in seconds",
    labelNames: ["status", "model", "operation"] as const,
    buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10, 20, 30, 60],
    registers: [this.registry],
  });

  private readonly assistantTokensTotal = new Counter({
    name: "assistant_tokens_total",
    help: "Total assistant token usage grouped by model and token type",
    labelNames: ["model", "token_type"] as const,
    registers: [this.registry],
  });

  private readonly assistantEstimatedCostUsdTotal = new Counter({
    name: "assistant_estimated_cost_usd_total",
    help: "Total estimated assistant cost in USD grouped by model",
    labelNames: ["model"] as const,
    registers: [this.registry],
  });

  private readonly redisUp = new Gauge({
    name: "redis_up",
    help: "Redis connectivity status where 1 means reachable and 0 means unreachable",
    registers: [this.registry],
  });

  private readonly cacheRequestsTotal = new Counter({
    name: "cache_requests_total",
    help: "Total cache lookups by namespace and outcome",
    labelNames: ["namespace", "outcome"] as const,
    registers: [this.registry],
  });

  private readonly apiUptimeSeconds = new Gauge({
    name: "api_uptime_seconds",
    help: "API process uptime in seconds",
    registers: [this.registry],
    collect() {
      this.set(process.uptime());
    },
  });

  constructor() {
    collectDefaultMetrics({
      prefix: "api_",
      register: this.registry,
    });
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  recordHttpRequest(input: {
    durationMs: number;
    method: string;
    route: string;
    statusCode: number;
  }): void {
    const labels = {
      method: input.method,
      route: input.route,
      status_code: String(input.statusCode),
    };

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDurationSeconds.observe(labels, input.durationMs / 1000);

    if (input.statusCode >= 400) {
      this.httpErrorsTotal.inc(labels);
    }
  }

  incrementQueueJob(queue: string, status: "completed" | "failed"): void {
    this.queueJobsTotal.inc({ queue, status });
  }

  setRedisUp(isUp: boolean): void {
    this.redisUp.set(isUp ? 1 : 0);
  }

  recordCacheRequest(
    namespace: string,
    outcome: "hit" | "miss" | "read_error" | "write_error",
  ): void {
    this.cacheRequestsTotal.inc({ namespace, outcome });
  }

  recordAssistantRequest(input: {
    durationMs: number;
    estimatedCostUsd?: number;
    model: string;
    operation: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    status: "success" | "failed" | "placeholder";
  }): void {
    const labels = {
      model: input.model,
      operation: input.operation,
      status: input.status,
    };

    this.assistantRequestsTotal.inc(labels);
    this.assistantRequestDurationSeconds.observe(
      labels,
      input.durationMs / 1000,
    );

    if (typeof input.promptTokens === "number" && input.promptTokens > 0) {
      this.assistantTokensTotal.inc(
        { model: input.model, token_type: "prompt" },
        input.promptTokens,
      );
    }

    if (
      typeof input.completionTokens === "number" &&
      input.completionTokens > 0
    ) {
      this.assistantTokensTotal.inc(
        { model: input.model, token_type: "completion" },
        input.completionTokens,
      );
    }

    if (typeof input.totalTokens === "number" && input.totalTokens > 0) {
      this.assistantTokensTotal.inc(
        { model: input.model, token_type: "total" },
        input.totalTokens,
      );
    }

    if (
      typeof input.estimatedCostUsd === "number" &&
      Number.isFinite(input.estimatedCostUsd) &&
      input.estimatedCostUsd > 0
    ) {
      this.assistantEstimatedCostUsdTotal.inc(
        { model: input.model },
        input.estimatedCostUsd,
      );
    }
  }
}
