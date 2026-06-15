CREATE TYPE "public"."document_audit_event_kind" AS ENUM('uploaded', 'ai_extraction', 'load_link', 'driver_link', 'custom');--> statement-breakpoint
CREATE TYPE "public"."document_audit_event_tone" AS ENUM('green', 'navy', 'violet');--> statement-breakpoint
CREATE TABLE "document_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"kind" "document_audit_event_kind" DEFAULT 'custom' NOT NULL,
	"label" varchar(255) NOT NULL,
	"actor" varchar(160) NOT NULL,
	"actor_badge" varchar(3) NOT NULL,
	"role" varchar(160) NOT NULL,
	"tone" "document_audit_event_tone" DEFAULT 'navy' NOT NULL,
	"event_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_audit_events" ADD CONSTRAINT "document_audit_events_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_audit_events_document_id_idx" ON "document_audit_events" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_audit_events_kind_idx" ON "document_audit_events" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "document_audit_events_tone_idx" ON "document_audit_events" USING btree ("tone");--> statement-breakpoint
CREATE INDEX "document_audit_events_event_at_idx" ON "document_audit_events" USING btree ("event_at");