import { pgEnum } from "drizzle-orm/pg-core";

// ── User & Auth ──────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
  "editor",
]);

// ── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "incomplete",
]);

// ── Places ───────────────────────────────────────────────────────────────────
export const budgetLevelEnum = pgEnum("budget_level", [
  "free",
  "budget",
  "mid_range",
  "premium",
  "luxury",
]);

// ── Trips ────────────────────────────────────────────────────────────────────
export const tripStatusEnum = pgEnum("trip_status", [
  "draft",
  "planning",
  "active",
  "completed",
  "archived",
]);

export const tripCollaboratorRoleEnum = pgEnum("trip_collaborator_role", [
  "owner",
  "editor",
  "viewer",
]);

// ── Vehicles ─────────────────────────────────────────────────────────────────
export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "car",
  "motorcycle",
  "campervan",
  "rv",
]);

// ── Collections ──────────────────────────────────────────────────────────────
export const collectionTypeEnum = pgEnum("collection_type", [
  "user",
  "editorial",
  "curated",
]);

// ── AI ───────────────────────────────────────────────────────────────────────
export const aiRunStatusEnum = pgEnum("ai_run_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

// ── Sponsored placements ─────────────────────────────────────────────────────
export const placementTypeEnum = pgEnum("placement_type", [
  "map_pin",
  "listing",
  "featured",
  "banner",
]);

// ── Import runs ──────────────────────────────────────────────────────────────
export const importRunStatusEnum = pgEnum("import_run_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

// ── Social (Conectar) ───────────────────────────────────────────────────────
export const socialIntentEnum = pgEnum("social_intent", [
  "convivir",
  "salir",
  "explorar",
  "conocer",
]);

export const socialSwipeActionEnum = pgEnum("social_swipe_action", [
  "like",
  "pass",
]);

export const socialReportStatusEnum = pgEnum("social_report_status", [
  "pending",
  "reviewed",
  "dismissed",
  "actioned",
]);

export const socialCommunityTypeEnum = pgEnum("social_community_type", [
  "forum",
  "group",
  "channel",
]);

export const socialCommunityRoleEnum = pgEnum("social_community_role", [
  "member",
  "moderator",
  "owner",
]);

export const socialContentStatusEnum = pgEnum("social_content_status", [
  "published",
  "hidden",
  "removed",
]);
