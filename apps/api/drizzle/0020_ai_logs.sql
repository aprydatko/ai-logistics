CREATE TYPE "public"."ai_log_source" AS ENUM('web', 'mobile', 'api');--> statement-breakpoint
CREATE TYPE "public"."ai_log_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TABLE "ai_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation" varchar(160) NOT NULL,
	"model" varchar(120) NOT NULL,
	"status" "ai_log_status" DEFAULT 'success' NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost_usd" numeric(12, 6) DEFAULT '0' NOT NULL,
	"user_id" uuid,
	"user_name" varchar(200) NOT NULL,
	"source" "ai_log_source" DEFAULT 'web' NOT NULL,
	"provider" varchar(80) DEFAULT 'openai' NOT NULL,
	"provider_request_id" varchar(160),
	"request_input" text NOT NULL,
	"response_output" text,
	"error_message" text,
	"linked_entity" jsonb,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_logs_created_at_idx" ON "ai_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_logs_user_id_idx" ON "ai_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_logs_status_idx" ON "ai_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_logs_model_idx" ON "ai_logs" USING btree ("model");
