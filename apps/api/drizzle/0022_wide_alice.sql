CREATE TYPE "public"."notification_email_frequency" AS ENUM('off', 'instant', 'daily');--> statement-breakpoint
CREATE TYPE "public"."notification_category" AS ENUM('loads', 'drivers', 'incidents', 'documents', 'ai', 'system');--> statement-breakpoint
CREATE TYPE "public"."notification_entity_type" AS ENUM('incident');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('incident_created', 'incident_status_changed', 'incident_timeline_updated', 'system', 'ai_report');--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_frequency" "notification_email_frequency" DEFAULT 'off' NOT NULL,
	"loads_in_app_enabled" boolean DEFAULT true NOT NULL,
	"loads_email_enabled" boolean DEFAULT false NOT NULL,
	"drivers_in_app_enabled" boolean DEFAULT true NOT NULL,
	"drivers_email_enabled" boolean DEFAULT false NOT NULL,
	"incidents_in_app_enabled" boolean DEFAULT true NOT NULL,
	"incidents_email_enabled" boolean DEFAULT false NOT NULL,
	"documents_in_app_enabled" boolean DEFAULT false NOT NULL,
	"documents_email_enabled" boolean DEFAULT false NOT NULL,
	"ai_in_app_enabled" boolean DEFAULT true NOT NULL,
	"ai_email_enabled" boolean DEFAULT false NOT NULL,
	"system_in_app_enabled" boolean DEFAULT false NOT NULL,
	"system_email_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "notification_category" NOT NULL,
	"type" "notification_type" NOT NULL,
	"channels" jsonb DEFAULT '["in_app"]'::jsonb NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" varchar(500) NOT NULL,
	"entity_type" "notification_entity_type",
	"entity_id" uuid,
	"href" varchar(255),
	"read_at" timestamp with time zone,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_user_id_unique" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_at_idx" ON "notifications" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
