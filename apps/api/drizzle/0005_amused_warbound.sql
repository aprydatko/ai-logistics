CREATE TYPE "public"."driver_status" AS ENUM('available', 'on_trip', 'off_duty', 'maintenance');--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "status" "driver_status" DEFAULT 'available' NOT NULL;--> statement-breakpoint
CREATE INDEX "drivers_status_idx" ON "drivers" USING btree ("status");