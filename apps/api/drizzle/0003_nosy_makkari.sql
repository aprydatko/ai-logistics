DROP INDEX "drivers_user_id_idx";--> statement-breakpoint
DROP INDEX "drivers_truck_number_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "drivers_user_id_unique" ON "drivers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "drivers_truck_number_unique" ON "drivers" USING btree ("truck_number");--> statement-breakpoint
CREATE UNIQUE INDEX "drivers_trailer_number_unique" ON "drivers" USING btree ("trailer_number");