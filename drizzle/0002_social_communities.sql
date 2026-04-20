CREATE TYPE "public"."social_community_role" AS ENUM('member', 'moderator', 'owner');--> statement-breakpoint
CREATE TYPE "public"."social_community_type" AS ENUM('forum', 'group', 'channel');--> statement-breakpoint
CREATE TYPE "public"."social_content_status" AS ENUM('published', 'hidden', 'removed');--> statement-breakpoint
CREATE TABLE "social_communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "social_community_type" NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" varchar(600),
	"cover_photo_url" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"created_by_user_id" uuid,
	"member_count" integer DEFAULT 0 NOT NULL,
	"post_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_communities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "social_community_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"body" varchar(4000) NOT NULL,
	"status" "social_content_status" DEFAULT 'published' NOT NULL,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"flag_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_community_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "social_community_role" DEFAULT 'member' NOT NULL,
	"approved_at" timestamp with time zone,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" varchar(8000) NOT NULL,
	"photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"photo_hashes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "social_content_status" DEFAULT 'published' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"flag_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_community_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_id" uuid,
	"comment_id" uuid,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_content_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"post_id" uuid,
	"comment_id" uuid,
	"reason" varchar(80) NOT NULL,
	"note" varchar(1000),
	"status" "social_report_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "social_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"url" text NOT NULL,
	"mime" varchar(60) NOT NULL,
	"width" integer,
	"height" integer,
	"size" integer,
	"sha256" varchar(64) NOT NULL,
	"scope" varchar(40) NOT NULL,
	"moderation_status" "social_content_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_communities" ADD CONSTRAINT "social_communities_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_community_comments" ADD CONSTRAINT "social_community_comments_post_id_social_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_community_comments" ADD CONSTRAINT "social_community_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_community_members" ADD CONSTRAINT "social_community_members_community_id_social_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."social_communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_community_members" ADD CONSTRAINT "social_community_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_community_posts" ADD CONSTRAINT "social_community_posts_community_id_social_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."social_communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_community_posts" ADD CONSTRAINT "social_community_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_community_votes" ADD CONSTRAINT "social_community_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_community_votes" ADD CONSTRAINT "social_community_votes_post_id_social_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_community_votes" ADD CONSTRAINT "social_community_votes_comment_id_social_community_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."social_community_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_content_flags" ADD CONSTRAINT "social_content_flags_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_content_flags" ADD CONSTRAINT "social_content_flags_post_id_social_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_content_flags" ADD CONSTRAINT "social_content_flags_comment_id_social_community_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."social_community_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_uploads" ADD CONSTRAINT "social_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_communities_type_idx" ON "social_communities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "social_communities_slug_idx" ON "social_communities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "social_community_comments_post_idx" ON "social_community_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "social_community_comments_author_idx" ON "social_community_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "social_community_comments_status_idx" ON "social_community_comments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "social_community_members_pair_uq" ON "social_community_members" USING btree ("community_id","user_id");--> statement-breakpoint
CREATE INDEX "social_community_members_user_idx" ON "social_community_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "social_community_members_role_idx" ON "social_community_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "social_community_posts_community_idx" ON "social_community_posts" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "social_community_posts_author_idx" ON "social_community_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "social_community_posts_status_idx" ON "social_community_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "social_community_posts_created_idx" ON "social_community_posts" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "social_community_votes_user_post_uq" ON "social_community_votes" USING btree ("user_id","post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "social_community_votes_user_comment_uq" ON "social_community_votes" USING btree ("user_id","comment_id");--> statement-breakpoint
CREATE INDEX "social_content_flags_post_idx" ON "social_content_flags" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "social_content_flags_comment_idx" ON "social_content_flags" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "social_content_flags_status_idx" ON "social_content_flags" USING btree ("status");--> statement-breakpoint
CREATE INDEX "social_uploads_user_idx" ON "social_uploads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "social_uploads_sha_idx" ON "social_uploads" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "social_uploads_scope_idx" ON "social_uploads" USING btree ("scope");