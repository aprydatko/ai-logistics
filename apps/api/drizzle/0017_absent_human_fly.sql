ALTER TABLE "documents" ADD COLUMN "mime_type" varchar(100);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "uploaded_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "page_count" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "extraction_model" varchar(100);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "processing_time_ms" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_uploaded_by_user_id_idx" ON "documents" USING btree ("uploaded_by_user_id");