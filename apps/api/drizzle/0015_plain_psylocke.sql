CREATE TYPE "public"."document_status" AS ENUM('complete', 'processing', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('bill_of_lading', 'proof_of_delivery', 'rate_confirmation', 'driver_license');--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"type" "document_type" NOT NULL,
	"status" "document_status" NOT NULL,
	"driver_id" uuid,
	"load_id" uuid,
	"uploaded_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_load_id_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_driver_id_idx" ON "documents" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "documents_load_id_idx" ON "documents" USING btree ("load_id");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_uploaded_at_idx" ON "documents" USING btree ("uploaded_at");