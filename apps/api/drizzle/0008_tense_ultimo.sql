CREATE TYPE "public"."driver_activity_type" AS ENUM('created', 'updated', 'status_changed', 'document_added', 'vehicle_assigned', 'trip_assigned', 'trip_completed');--> statement-breakpoint
CREATE TYPE "public"."driver_document_type" AS ENUM('license', 'medical_card', 'insurance', 'other');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('active', 'maintenance', 'inactive');--> statement-breakpoint
CREATE TABLE "driver_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"type" "driver_activity_type" NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"actor_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"type" "driver_document_type" NOT NULL,
	"name" varchar(200) NOT NULL,
	"document_number" varchar(100),
	"file_url" text,
	"storage_key" text,
	"mime_type" varchar(100),
	"file_size" bigint,
	"issued_at" date,
	"expires_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_vehicle_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unassigned_at" timestamp with time zone,
	"is_primary" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_number" varchar(50) NOT NULL,
	"type" varchar(50) DEFAULT 'truck' NOT NULL,
	"make" varchar(100),
	"model" varchar(100),
	"year" integer,
	"vin" varchar(17),
	"license_plate" varchar(30),
	"license_state" varchar(80),
	"odometer_miles" integer,
	"status" "vehicle_status" DEFAULT 'active' NOT NULL,
	"last_service_at" date,
	"next_service_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "rating" numeric(2, 1) DEFAULT '4.8' NOT NULL;--> statement-breakpoint
ALTER TABLE "driver_activity" ADD CONSTRAINT "driver_activity_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_activity" ADD CONSTRAINT "driver_activity_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_vehicle_assignments" ADD CONSTRAINT "driver_vehicle_assignments_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_vehicle_assignments" ADD CONSTRAINT "driver_vehicle_assignments_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "driver_activity_driver_id_created_at_idx" ON "driver_activity" USING btree ("driver_id","created_at");--> statement-breakpoint
CREATE INDEX "driver_documents_driver_id_idx" ON "driver_documents" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "driver_documents_expires_at_idx" ON "driver_documents" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "driver_vehicle_assignments_driver_id_idx" ON "driver_vehicle_assignments" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "driver_vehicle_assignments_vehicle_id_idx" ON "driver_vehicle_assignments" USING btree ("vehicle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_unit_number_unique" ON "vehicles" USING btree ("unit_number");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_vin_unique" ON "vehicles" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "vehicles_status_idx" ON "vehicles" USING btree ("status");
