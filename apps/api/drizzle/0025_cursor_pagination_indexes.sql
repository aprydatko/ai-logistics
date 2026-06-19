CREATE INDEX "ai_logs_created_at_id_idx" ON "ai_logs" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "notifications_created_at_id_idx" ON "notifications" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_created_at_id_idx" ON "notifications" USING btree ("user_id","created_at","id");--> statement-breakpoint
