ALTER TABLE "drivers" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "address" varchar(255);--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "hire_date" date;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "license_type" varchar(30);--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "license_number" varchar(80);--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "license_expiration_date" date;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "license_state" varchar(80);--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "emergency_contact" varchar(200);--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "emergency_phone" varchar(30);--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "notes" text;