CREATE TYPE "public"."document_storage_provider" AS ENUM('local', 's3');--> statement-breakpoint
CREATE TYPE "public"."document_upload_status" AS ENUM('pending', 'uploaded', 'completed', 'expired');--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "storage_provider" "document_storage_provider" DEFAULT 'local' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "storage_bucket" varchar(255);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "object_key" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "etag" varchar(255);--> statement-breakpoint
CREATE TABLE "document_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_provider" "document_storage_provider" DEFAULT 's3' NOT NULL,
	"bucket" varchar(255) NOT NULL,
	"object_key" text NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"type" "document_type" NOT NULL,
	"driver_id" uuid,
	"load_id" uuid,
	"uploaded_by_user_id" uuid NOT NULL,
	"analyze_with_vision" boolean DEFAULT true NOT NULL,
	"status" "document_upload_status" DEFAULT 'pending' NOT NULL,
	"etag" varchar(255),
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_uploads" ADD CONSTRAINT "document_uploads_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_uploads" ADD CONSTRAINT "document_uploads_load_id_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_uploads" ADD CONSTRAINT "document_uploads_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_storage_provider_idx" ON "documents" USING btree ("storage_provider");--> statement-breakpoint
CREATE INDEX "documents_object_key_idx" ON "documents" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "document_uploads_status_idx" ON "document_uploads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_uploads_uploaded_by_user_id_idx" ON "document_uploads" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "document_uploads_object_key_idx" ON "document_uploads" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "document_uploads_expires_at_idx" ON "document_uploads" USING btree ("expires_at");
