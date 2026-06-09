ALTER TABLE "loads" ADD COLUMN "route_points" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "loads" ADD COLUMN "timeline" jsonb DEFAULT '[]'::jsonb NOT NULL;