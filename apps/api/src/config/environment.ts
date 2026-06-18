import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
    .default("info"),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().min(1).optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  API_PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  REDIS_URL: z.string().url().default("redis://127.0.0.1:6379"),
  CACHE_LIST_TTL_SECONDS: z.coerce.number().int().positive().default(30),
  CACHE_DETAIL_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  CACHE_METRICS_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  BULL_BOARD_PATH: z.string().default("/api/queues"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_DOCUMENT_MODEL: z.string().default("gpt-4.1-mini"),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  S3_ENDPOINT: z.string().min(1).optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().min(1).optional(),
  S3_SECRET_KEY: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).default("documents"),
  S3_PUBLIC_BASE_URL: z.string().url().optional(),
  S3_USE_SSL: z.coerce.boolean().default(false),
  S3_PRESIGN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  EMAIL_RETRY_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
  EMAIL_RETRY_INITIAL_DELAY_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(1000),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  return environmentSchema.parse(config);
}
