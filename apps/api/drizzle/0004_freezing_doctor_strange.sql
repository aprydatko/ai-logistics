CREATE TYPE "public"."load_status" AS ENUM('new', 'assigned', 'in_transit', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "loads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" varchar(100) NOT NULL,
	"pickup_address" text NOT NULL,
	"delivery_address" text NOT NULL,
	"pickup_date" timestamp with time zone NOT NULL,
	"delivery_date" timestamp with time zone NOT NULL,
	"weight" integer NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"miles" integer NOT NULL,
	"notes" text,
	"status" "load_status" DEFAULT 'new' NOT NULL,
	"broker" jsonb NOT NULL,
	"driver_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loads" ADD CONSTRAINT "loads_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "loads_reference_number_unique" ON "loads" USING btree ("reference_number");--> statement-breakpoint
CREATE INDEX "loads_driver_id_idx" ON "loads" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "loads_pickup_date_idx" ON "loads" USING btree ("pickup_date");