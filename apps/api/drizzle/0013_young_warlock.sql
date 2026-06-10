CREATE TYPE "public"."incident_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('open', 'investigating', 'monitoring', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."incident_type" AS ENUM('flat_tire', 'delay', 'accident', 'fuel_issue', 'maintenance', 'other');--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"load_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"location" varchar(500),
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"type" "incident_type" NOT NULL,
	"priority" "incident_priority" NOT NULL,
	"status" "incident_status" DEFAULT 'open' NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_load_id_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "incidents_load_id_idx" ON "incidents" USING btree ("load_id");--> statement-breakpoint
CREATE INDEX "incidents_status_idx" ON "incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "incidents_priority_idx" ON "incidents" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "incidents_occurred_at_idx" ON "incidents" USING btree ("occurred_at");