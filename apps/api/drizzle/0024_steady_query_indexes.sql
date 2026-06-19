CREATE INDEX "loads_status_pickup_date_created_at_idx" ON "loads" USING btree ("status","pickup_date","created_at");--> statement-breakpoint
CREATE INDEX "loads_driver_id_pickup_date_created_at_idx" ON "loads" USING btree ("driver_id","pickup_date","created_at");--> statement-breakpoint
CREATE INDEX "loads_active_driver_id_idx" ON "loads" USING btree ("driver_id") WHERE "status" in ('assigned', 'in_transit');--> statement-breakpoint
CREATE INDEX "documents_driver_id_uploaded_at_idx" ON "documents" USING btree ("driver_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "documents_load_id_uploaded_at_idx" ON "documents" USING btree ("load_id","uploaded_at");--> statement-breakpoint
CREATE INDEX "documents_status_uploaded_at_idx" ON "documents" USING btree ("status","uploaded_at");--> statement-breakpoint
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_unread_user_id_created_at_idx" ON "notifications" USING btree ("user_id","created_at") WHERE "read_at" is null;--> statement-breakpoint
CREATE INDEX "incidents_status_occurred_at_idx" ON "incidents" USING btree ("status","occurred_at");--> statement-breakpoint
CREATE INDEX "incidents_load_id_occurred_at_idx" ON "incidents" USING btree ("load_id","occurred_at");--> statement-breakpoint
CREATE INDEX "drivers_is_active_status_name_idx" ON "drivers" USING btree ("is_active","status","last_name","first_name");
