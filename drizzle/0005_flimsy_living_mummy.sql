CREATE TABLE "mobile_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" varchar(20) NOT NULL,
	"revenuecat_user_id" varchar(255) NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"plan_slug" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"original_transaction_id" varchar(255),
	"environment" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mobile_subscriptions" ADD CONSTRAINT "mobile_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mobile_subscriptions_user_id_idx" ON "mobile_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mobile_subscriptions_status_idx" ON "mobile_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mobile_subscriptions_source_idx" ON "mobile_subscriptions" USING btree ("source");--> statement-breakpoint
CREATE UNIQUE INDEX "mobile_subscriptions_orig_tx_idx" ON "mobile_subscriptions" USING btree ("original_transaction_id");