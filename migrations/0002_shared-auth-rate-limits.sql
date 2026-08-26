CREATE TABLE "auth_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"reset_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_rate_limits_reset_idx" ON "auth_rate_limits" USING btree ("reset_at");