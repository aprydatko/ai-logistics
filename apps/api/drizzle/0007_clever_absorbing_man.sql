ALTER TABLE "drivers" DROP CONSTRAINT "drivers_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "drivers" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "drivers" ALTER COLUMN "truck_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "drivers" ALTER COLUMN "trailer_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "driver_code" varchar(50);--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "email" varchar(255);--> statement-breakpoint
UPDATE "drivers"
SET
  "driver_code" = 'DR-' || upper(substr(replace("drivers"."id"::text, '-', ''), 1, 8)),
  "email" = COALESCE(
    (SELECT "users"."email" FROM "users" WHERE "users"."id" = "drivers"."user_id"),
    'driver-' || replace("drivers"."id"::text, '-', '') || '@example.invalid'
  );--> statement-breakpoint
ALTER TABLE "drivers" ALTER COLUMN "driver_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "drivers" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "drivers_driver_code_unique" ON "drivers" USING btree ("driver_code");--> statement-breakpoint
CREATE UNIQUE INDEX "drivers_email_unique" ON "drivers" USING btree ("email");
