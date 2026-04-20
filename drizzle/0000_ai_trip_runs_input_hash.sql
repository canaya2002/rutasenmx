CREATE TYPE "public"."ai_run_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."budget_level" AS ENUM('free', 'budget', 'mid_range', 'premium', 'luxury');--> statement-breakpoint
CREATE TYPE "public"."collection_type" AS ENUM('user', 'editorial', 'curated');--> statement-breakpoint
CREATE TYPE "public"."import_run_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."placement_type" AS ENUM('map_pin', 'listing', 'featured', 'banner');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."trip_collaborator_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('draft', 'planning', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'editor');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('car', 'motorcycle', 'campervan', 'rv');--> statement-breakpoint
CREATE TABLE "affiliate_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"place_id" uuid,
	"partner" varchar(200) NOT NULL,
	"destination_url" text NOT NULL,
	"utm_params" jsonb,
	"referrer" text,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_trip_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trip_id" uuid,
	"input_params" jsonb,
	"input_hash" varchar(64),
	"status" "ai_run_status" DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"feedback_score" integer,
	"feedback_notes" text,
	"model_used" varchar(100),
	"tokens_used" integer,
	"cost_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(200) NOT NULL,
	"entity_type" varchar(100),
	"entity_id" varchar(255),
	"old_data" jsonb,
	"new_data" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"subscription_id" uuid,
	"stripe_event_id" varchar(255),
	"event_type" varchar(200) NOT NULL,
	"amount_cents" integer,
	"currency" varchar(3) DEFAULT 'MXN',
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"editorial_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"slug" varchar(300) NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text,
	"cover_image_url" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"type" "collection_type" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(400) NOT NULL,
	"title" varchar(400) NOT NULL,
	"subtitle" varchar(400),
	"body" text,
	"excerpt" text,
	"cover_image_url" text,
	"author_name" varchar(200),
	"author_bio" text,
	"author_avatar_url" text,
	"category" varchar(100),
	"tags" jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_route_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_route_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"editorial_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(400) NOT NULL,
	"title" varchar(400) NOT NULL,
	"description" text,
	"cover_image_url" text,
	"origin_name" varchar(400),
	"destination_name" varchar(400),
	"states" jsonb,
	"duration_days" integer,
	"distance_km" double precision,
	"difficulty" varchar(50),
	"highlights" jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"feature_key" varchar(200) NOT NULL,
	"feature_value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(200) NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"conditions" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_run_id" uuid NOT NULL,
	"record_identifier" varchar(500),
	"error_type" varchar(200),
	"error_message" text,
	"raw_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_name" varchar(100) NOT NULL,
	"status" "import_run_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"total_records" integer,
	"inserted" integer,
	"updated" integer,
	"skipped" integer,
	"errors" integer,
	"dry_run" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(400) NOT NULL,
	"description" text,
	"partner_name" varchar(300) NOT NULL,
	"deal_code" varchar(100),
	"redirect_url" text,
	"discount_percent" integer,
	"discount_amount_cents" integer,
	"min_plan_required" varchar(100),
	"place_id" uuid,
	"category" varchar(100),
	"cover_image_url" text,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(150) NOT NULL,
	"name" varchar(200) NOT NULL,
	"name_en" varchar(200),
	"icon" varchar(100),
	"color" varchar(30),
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_text" varchar(500),
	"caption" text,
	"credit" varchar(300),
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(300),
	"body" text,
	"is_approved" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "place_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"source_name" varchar(100) NOT NULL,
	"source_id" varchar(255),
	"source_url" text,
	"source_data" jsonb,
	"source_hash" varchar(64),
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(400) NOT NULL,
	"name" varchar(400) NOT NULL,
	"name_alt" varchar(400),
	"short_description" text,
	"long_description" text,
	"latitude" double precision,
	"longitude" double precision,
	"state" varchar(200),
	"municipality" varchar(200),
	"locality" varchar(200),
	"address" text,
	"postal_code" varchar(10),
	"category_id" uuid,
	"subcategory_ids" jsonb,
	"badges" jsonb,
	"source_priority" integer DEFAULT 0,
	"confidence_score" integer DEFAULT 0,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_sponsored" boolean DEFAULT false NOT NULL,
	"editorial_notes" text,
	"primary_image_url" text,
	"website" varchar(512),
	"phone" varchar(50),
	"email" varchar(320),
	"opening_hours" jsonb,
	"price_info" jsonb,
	"accessibility_info" text,
	"pet_friendly" boolean,
	"family_friendly" boolean,
	"budget_level" "budget_level",
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"richness_score" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bio" text,
	"website" varchar(512),
	"social_links" jsonb,
	"preferred_language" varchar(10) DEFAULT 'es',
	"preferred_currency" varchar(3) DEFAULT 'MXN',
	"travel_style" varchar(100),
	"vehicle_type" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_snapshot_id" uuid NOT NULL,
	"segment_order" integer NOT NULL,
	"from_stop_id" uuid,
	"to_stop_id" uuid,
	"distance_km" double precision,
	"duration_minutes" integer,
	"toll_cost_cents" integer,
	"fuel_cost_cents" integer,
	"geometry_json" text,
	"instructions" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"geometry_json" text,
	"provider" varchar(100),
	"total_distance_km" double precision,
	"total_duration_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"collection_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" varchar(1000) NOT NULL,
	"page_type" varchar(100),
	"entity_id" uuid,
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"h1" varchar(300),
	"intro_text" text,
	"is_indexable" boolean DEFAULT true NOT NULL,
	"richness_score" integer DEFAULT 0,
	"canonical_url" text,
	"primary_keyword" varchar(200),
	"secondary_keywords" jsonb,
	"keyword_cluster" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsored_placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"campaign_name" varchar(300) NOT NULL,
	"placement_type" "placement_type" NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"budget_cents" integer,
	"spent_cents" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"price_monthly_cents" integer DEFAULT 0 NOT NULL,
	"price_annual_cents" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN' NOT NULL,
	"stripe_price_id_monthly" varchar(255),
	"stripe_price_id_annual" varchar(255),
	"max_saved_trips" integer,
	"max_stops_per_trip" integer,
	"features" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"stripe_subscription_id" varchar(255),
	"stripe_customer_id" varchar(255),
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid,
	"role" "trip_collaborator_role" DEFAULT 'viewer' NOT NULL,
	"invited_email" varchar(320),
	"invite_token" varchar(64),
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"date" date,
	"title" varchar(300),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"trip_day_id" uuid,
	"place_id" uuid,
	"custom_name" varchar(400),
	"custom_lat" double precision,
	"custom_lng" double precision,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"arrival_time" timestamp with time zone,
	"departure_time" timestamp with time zone,
	"duration_minutes" integer,
	"budget_cents" integer,
	"is_waypoint_only" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(400) NOT NULL,
	"slug" varchar(400) NOT NULL,
	"description" text,
	"origin_name" varchar(400),
	"origin_lat" double precision,
	"origin_lng" double precision,
	"destination_name" varchar(400),
	"destination_lat" double precision,
	"destination_lng" double precision,
	"status" "trip_status" DEFAULT 'draft' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"share_token" varchar(64),
	"vehicle_type" varchar(100),
	"avoid_tolls" boolean DEFAULT false NOT NULL,
	"avoid_highways" boolean DEFAULT false NOT NULL,
	"avoid_ferries" boolean DEFAULT false NOT NULL,
	"avoid_dirt_roads" boolean DEFAULT false NOT NULL,
	"total_distance_km" double precision,
	"total_duration_minutes" integer,
	"total_cost_estimate_cents" integer,
	"currency" varchar(3) DEFAULT 'MXN',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text,
	"name" varchar(255),
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vehicle_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" "vehicle_type" NOT NULL,
	"fuel_type" varchar(50),
	"fuel_efficiency_km_per_liter" double precision,
	"tank_capacity_liters" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_trip_runs" ADD CONSTRAINT "ai_trip_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_trip_runs" ADD CONSTRAINT "ai_trip_runs_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_places" ADD CONSTRAINT "collection_places_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_places" ADD CONSTRAINT "collection_places_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_route_places" ADD CONSTRAINT "content_route_places_content_route_id_content_routes_id_fk" FOREIGN KEY ("content_route_id") REFERENCES "public"."content_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_route_places" ADD CONSTRAINT "content_route_places_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_errors" ADD CONSTRAINT "import_errors_import_run_id_import_runs_id_fk" FOREIGN KEY ("import_run_id") REFERENCES "public"."import_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_deals" ADD CONSTRAINT "member_deals_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_images" ADD CONSTRAINT "place_images_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_reviews" ADD CONSTRAINT "place_reviews_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_reviews" ADD CONSTRAINT "place_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_sources" ADD CONSTRAINT "place_sources_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_tags" ADD CONSTRAINT "place_tags_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_category_id_place_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."place_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_route_snapshot_id_route_snapshots_id_fk" FOREIGN KEY ("route_snapshot_id") REFERENCES "public"."route_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_from_stop_id_trip_stops_id_fk" FOREIGN KEY ("from_stop_id") REFERENCES "public"."trip_stops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_to_stop_id_trip_stops_id_fk" FOREIGN KEY ("to_stop_id") REFERENCES "public"."trip_stops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_snapshots" ADD CONSTRAINT "route_snapshots_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsored_placements" ADD CONSTRAINT "sponsored_placements_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_collaborators" ADD CONSTRAINT "trip_collaborators_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_collaborators" ADD CONSTRAINT "trip_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_notes" ADD CONSTRAINT "trip_notes_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_notes" ADD CONSTRAINT "trip_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_day_id_trip_days_id_fk" FOREIGN KEY ("trip_day_id") REFERENCES "public"."trip_days"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_profiles" ADD CONSTRAINT "vehicle_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "affiliate_clicks_user_id_idx" ON "affiliate_clicks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_place_id_idx" ON "affiliate_clicks" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_partner_idx" ON "affiliate_clicks" USING btree ("partner");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_created_at_idx" ON "affiliate_clicks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_trip_runs_user_id_idx" ON "ai_trip_runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_trip_runs_trip_id_idx" ON "ai_trip_runs" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "ai_trip_runs_status_idx" ON "ai_trip_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_trip_runs_created_at_idx" ON "ai_trip_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_trip_runs_input_hash_idx" ON "ai_trip_runs" USING btree ("input_hash");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "billing_events_user_id_idx" ON "billing_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "billing_events_subscription_id_idx" ON "billing_events" USING btree ("subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_events_stripe_event_id_idx" ON "billing_events" USING btree ("stripe_event_id");--> statement-breakpoint
CREATE INDEX "billing_events_created_at_idx" ON "billing_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "collection_places_collection_id_idx" ON "collection_places" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "collection_places_place_id_idx" ON "collection_places" USING btree ("place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collection_places_collection_place_idx" ON "collection_places" USING btree ("collection_id","place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collections_slug_idx" ON "collections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "collections_user_id_idx" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "collections_type_idx" ON "collections" USING btree ("type");--> statement-breakpoint
CREATE INDEX "collections_is_public_idx" ON "collections" USING btree ("is_public");--> statement-breakpoint
CREATE UNIQUE INDEX "content_articles_slug_idx" ON "content_articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_articles_category_idx" ON "content_articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "content_articles_is_published_idx" ON "content_articles" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "content_articles_is_featured_idx" ON "content_articles" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "content_articles_published_at_idx" ON "content_articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "content_route_places_route_id_idx" ON "content_route_places" USING btree ("content_route_id");--> statement-breakpoint
CREATE INDEX "content_route_places_place_id_idx" ON "content_route_places" USING btree ("place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_route_places_route_place_idx" ON "content_route_places" USING btree ("content_route_id","place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_routes_slug_idx" ON "content_routes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_routes_is_published_idx" ON "content_routes" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "content_routes_is_featured_idx" ON "content_routes" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "entitlements_plan_id_idx" ON "entitlements" USING btree ("plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlements_plan_feature_idx" ON "entitlements" USING btree ("plan_id","feature_key");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flags_key_idx" ON "feature_flags" USING btree ("key");--> statement-breakpoint
CREATE INDEX "import_errors_import_run_id_idx" ON "import_errors" USING btree ("import_run_id");--> statement-breakpoint
CREATE INDEX "import_errors_error_type_idx" ON "import_errors" USING btree ("error_type");--> statement-breakpoint
CREATE INDEX "import_runs_source_name_idx" ON "import_runs" USING btree ("source_name");--> statement-breakpoint
CREATE INDEX "import_runs_status_idx" ON "import_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_runs_created_at_idx" ON "import_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "member_deals_place_id_idx" ON "member_deals" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "member_deals_is_active_idx" ON "member_deals" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "member_deals_category_idx" ON "member_deals" USING btree ("category");--> statement-breakpoint
CREATE INDEX "member_deals_expires_at_idx" ON "member_deals" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "place_categories_slug_idx" ON "place_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "place_categories_parent_id_idx" ON "place_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "place_images_place_id_idx" ON "place_images" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "place_images_is_primary_idx" ON "place_images" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "place_reviews_place_id_idx" ON "place_reviews" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "place_reviews_user_id_idx" ON "place_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "place_reviews_rating_idx" ON "place_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "place_reviews_is_approved_idx" ON "place_reviews" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "place_sources_place_id_idx" ON "place_sources" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "place_sources_source_name_idx" ON "place_sources" USING btree ("source_name");--> statement-breakpoint
CREATE UNIQUE INDEX "place_sources_source_name_source_id_idx" ON "place_sources" USING btree ("source_name","source_id");--> statement-breakpoint
CREATE INDEX "place_tags_place_id_idx" ON "place_tags" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "place_tags_tag_idx" ON "place_tags" USING btree ("tag");--> statement-breakpoint
CREATE UNIQUE INDEX "place_tags_place_tag_idx" ON "place_tags" USING btree ("place_id","tag");--> statement-breakpoint
CREATE UNIQUE INDEX "places_slug_idx" ON "places" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "places_category_id_idx" ON "places" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "places_state_idx" ON "places" USING btree ("state");--> statement-breakpoint
CREATE INDEX "places_is_published_idx" ON "places" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "places_is_featured_idx" ON "places" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "places_budget_level_idx" ON "places" USING btree ("budget_level");--> statement-breakpoint
CREATE INDEX "places_created_at_idx" ON "places" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "places_lat_lng_idx" ON "places" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "places_richness_score_idx" ON "places" USING btree ("richness_score");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_id_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "route_segments_route_snapshot_id_idx" ON "route_segments" USING btree ("route_snapshot_id");--> statement-breakpoint
CREATE INDEX "route_segments_segment_order_idx" ON "route_segments" USING btree ("route_snapshot_id","segment_order");--> statement-breakpoint
CREATE INDEX "route_snapshots_trip_id_idx" ON "route_snapshots" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "saved_places_user_id_idx" ON "saved_places" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_places_place_id_idx" ON "saved_places" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "saved_places_collection_id_idx" ON "saved_places" USING btree ("collection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_places_user_place_idx" ON "saved_places" USING btree ("user_id","place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_pages_path_idx" ON "seo_pages" USING btree ("path");--> statement-breakpoint
CREATE INDEX "seo_pages_page_type_idx" ON "seo_pages" USING btree ("page_type");--> statement-breakpoint
CREATE INDEX "seo_pages_entity_id_idx" ON "seo_pages" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "seo_pages_keyword_cluster_idx" ON "seo_pages" USING btree ("keyword_cluster");--> statement-breakpoint
CREATE INDEX "sponsored_placements_place_id_idx" ON "sponsored_placements" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "sponsored_placements_is_active_idx" ON "sponsored_placements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sponsored_placements_placement_type_idx" ON "sponsored_placements" USING btree ("placement_type");--> statement-breakpoint
CREATE INDEX "sponsored_placements_start_end_idx" ON "sponsored_placements" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_plans_slug_idx" ON "subscription_plans" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_stripe_sub_id_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "trip_collaborators_trip_id_idx" ON "trip_collaborators" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_collaborators_user_id_idx" ON "trip_collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_collaborators_invite_token_idx" ON "trip_collaborators" USING btree ("invite_token");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_collaborators_trip_user_idx" ON "trip_collaborators" USING btree ("trip_id","user_id");--> statement-breakpoint
CREATE INDEX "trip_days_trip_id_idx" ON "trip_days" USING btree ("trip_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_days_trip_day_idx" ON "trip_days" USING btree ("trip_id","day_number");--> statement-breakpoint
CREATE INDEX "trip_notes_trip_id_idx" ON "trip_notes" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_notes_user_id_idx" ON "trip_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trip_stops_trip_id_idx" ON "trip_stops" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_stops_trip_day_id_idx" ON "trip_stops" USING btree ("trip_day_id");--> statement-breakpoint
CREATE INDEX "trip_stops_place_id_idx" ON "trip_stops" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "trip_stops_sort_order_idx" ON "trip_stops" USING btree ("trip_id","sort_order");--> statement-breakpoint
CREATE INDEX "trips_user_id_idx" ON "trips" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trips_status_idx" ON "trips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trips_is_public_idx" ON "trips" USING btree ("is_public");--> statement-breakpoint
CREATE UNIQUE INDEX "trips_slug_idx" ON "trips" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "trips_share_token_idx" ON "trips" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "trips_created_at_idx" ON "trips" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "vehicle_profiles_user_id_idx" ON "vehicle_profiles" USING btree ("user_id");