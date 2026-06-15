import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const aiLogStatusEnum = pgEnum("ai_log_status", ["success", "failed"]);
export const aiLogSourceEnum = pgEnum("ai_log_source", [
  "web",
  "mobile",
  "api",
]);

export type AiLogLinkedEntitySnapshot = {
  type: string;
  recordId: string;
  title: string;
  route?: string;
};

export const aiLogs = pgTable(
  "ai_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    operation: varchar("operation", { length: 160 }).notNull(),
    model: varchar("model", { length: 120 }).notNull(),
    status: aiLogStatusEnum("status").default("success").notNull(),
    latencyMs: integer("latency_ms").default(0).notNull(),
    promptTokens: integer("prompt_tokens").default(0).notNull(),
    completionTokens: integer("completion_tokens").default(0).notNull(),
    totalTokens: integer("total_tokens").default(0).notNull(),
    estimatedCostUsd: numeric("estimated_cost_usd", {
      precision: 12,
      scale: 6,
    })
      .default("0")
      .notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    userName: varchar("user_name", { length: 200 }).notNull(),
    source: aiLogSourceEnum("source").default("web").notNull(),
    provider: varchar("provider", { length: 80 }).default("openai").notNull(),
    providerRequestId: varchar("provider_request_id", { length: 160 }),
    requestInput: text("request_input").notNull(),
    responseOutput: text("response_output"),
    errorMessage: text("error_message"),
    linkedEntity: jsonb("linked_entity").$type<AiLogLinkedEntitySnapshot>(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ai_logs_created_at_idx").on(table.createdAt),
    index("ai_logs_user_id_idx").on(table.userId),
    index("ai_logs_status_idx").on(table.status),
    index("ai_logs_model_idx").on(table.model),
  ],
);

export type AiLogRecord = typeof aiLogs.$inferSelect;
export type NewAiLogRecord = typeof aiLogs.$inferInsert;
