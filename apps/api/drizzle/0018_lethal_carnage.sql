CREATE TYPE "public"."document_extracted_field_event_type" AS ENUM('extracted', 'edited', 'confirmed', 'rejected', 'reset');--> statement-breakpoint
CREATE TYPE "public"."document_extracted_field_status" AS ENUM('extracted', 'edited', 'confirmed', 'rejected', 'missing');--> statement-breakpoint
CREATE TABLE "document_extracted_field_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"event_type" "document_extracted_field_event_type" NOT NULL,
	"actor_user_id" uuid,
	"previous_value" text,
	"next_value" text,
	"previous_status" "document_extracted_field_status",
	"next_status" "document_extracted_field_status",
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_extracted_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"field_key" varchar(100) NOT NULL,
	"label" varchar(160) NOT NULL,
	"raw_value" text,
	"normalized_value" text,
	"confidence" integer,
	"status" "document_extracted_field_status" DEFAULT 'extracted' NOT NULL,
	"extracted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"extracted_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_extracted_field_events" ADD CONSTRAINT "document_extracted_field_events_field_id_document_extracted_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."document_extracted_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extracted_field_events" ADD CONSTRAINT "document_extracted_field_events_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extracted_field_events" ADD CONSTRAINT "document_extracted_field_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extracted_fields" ADD CONSTRAINT "document_extracted_fields_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extracted_fields" ADD CONSTRAINT "document_extracted_fields_extracted_by_user_id_users_id_fk" FOREIGN KEY ("extracted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_extracted_fields" ADD CONSTRAINT "document_extracted_fields_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_extracted_field_events_field_id_idx" ON "document_extracted_field_events" USING btree ("field_id");--> statement-breakpoint
CREATE INDEX "document_extracted_field_events_document_id_idx" ON "document_extracted_field_events" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_extracted_field_events_event_type_idx" ON "document_extracted_field_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "document_extracted_field_events_actor_user_id_idx" ON "document_extracted_field_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "document_extracted_field_events_created_at_idx" ON "document_extracted_field_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "document_extracted_fields_document_id_idx" ON "document_extracted_fields" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_extracted_fields_field_key_idx" ON "document_extracted_fields" USING btree ("field_key");--> statement-breakpoint
CREATE INDEX "document_extracted_fields_status_idx" ON "document_extracted_fields" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_extracted_fields_reviewed_by_user_id_idx" ON "document_extracted_fields" USING btree ("reviewed_by_user_id");