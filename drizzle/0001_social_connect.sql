CREATE TYPE "public"."social_intent" AS ENUM('convivir', 'salir', 'explorar', 'conocer');--> statement-breakpoint
CREATE TYPE "public"."social_report_status" AS ENUM('pending', 'reviewed', 'dismissed', 'actioned');--> statement-breakpoint
CREATE TYPE "public"."social_swipe_action" AS ENUM('like', 'pass');--> statement-breakpoint
CREATE TABLE "social_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blocker_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_a_id" uuid NOT NULL,
	"user_b_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone,
	"closed_by_user_id" uuid,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "social_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" varchar(2000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "social_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" varchar(80) NOT NULL,
	"bio" varchar(280),
	"photo_url" text,
	"destino_estado_slug" varchar(64),
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"intent" "social_intent",
	"age" integer,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"travel_from" date,
	"travel_to" date,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "social_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reported_id" uuid NOT NULL,
	"reason" varchar(80) NOT NULL,
	"note" varchar(1000),
	"status" "social_report_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "social_swipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"action" "social_swipe_action" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_blocks" ADD CONSTRAINT "social_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_blocks" ADD CONSTRAINT "social_blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_matches" ADD CONSTRAINT "social_matches_user_a_id_users_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_matches" ADD CONSTRAINT "social_matches_user_b_id_users_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_matches" ADD CONSTRAINT "social_matches_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_messages" ADD CONSTRAINT "social_messages_match_id_social_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."social_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_messages" ADD CONSTRAINT "social_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_reported_id_users_id_fk" FOREIGN KEY ("reported_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_swipes" ADD CONSTRAINT "social_swipes_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_swipes" ADD CONSTRAINT "social_swipes_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "social_blocks_pair_uq" ON "social_blocks" USING btree ("blocker_id","blocked_id");--> statement-breakpoint
CREATE INDEX "social_blocks_blocked_idx" ON "social_blocks" USING btree ("blocked_id");--> statement-breakpoint
CREATE UNIQUE INDEX "social_matches_pair_uq" ON "social_matches" USING btree ("user_a_id","user_b_id");--> statement-breakpoint
CREATE INDEX "social_matches_user_a_idx" ON "social_matches" USING btree ("user_a_id");--> statement-breakpoint
CREATE INDEX "social_matches_user_b_idx" ON "social_matches" USING btree ("user_b_id");--> statement-breakpoint
CREATE INDEX "social_matches_last_msg_idx" ON "social_matches" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "social_messages_match_idx" ON "social_messages" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "social_messages_sender_idx" ON "social_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "social_messages_created_idx" ON "social_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "social_profiles_user_id_idx" ON "social_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "social_profiles_visible_idx" ON "social_profiles" USING btree ("is_visible");--> statement-breakpoint
CREATE INDEX "social_profiles_destino_idx" ON "social_profiles" USING btree ("destino_estado_slug");--> statement-breakpoint
CREATE INDEX "social_reports_reported_idx" ON "social_reports" USING btree ("reported_id");--> statement-breakpoint
CREATE INDEX "social_reports_status_idx" ON "social_reports" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "social_swipes_pair_uq" ON "social_swipes" USING btree ("from_user_id","to_user_id");--> statement-breakpoint
CREATE INDEX "social_swipes_to_user_idx" ON "social_swipes" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "social_swipes_action_idx" ON "social_swipes" USING btree ("action");