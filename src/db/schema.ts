import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  doublePrecision,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import {
  userRoleEnum,
  subscriptionStatusEnum,
  budgetLevelEnum,
  tripStatusEnum,
  tripCollaboratorRoleEnum,
  vehicleTypeEnum,
  collectionTypeEnum,
  aiRunStatusEnum,
  placementTypeEnum,
  importRunStatusEnum,
  socialIntentEnum,
  socialSwipeActionEnum,
  socialReportStatusEnum,
  socialCommunityTypeEnum,
  socialCommunityRoleEnum,
  socialContentStatusEnum,
} from "./enums";

// Re-export enums so consumers can import everything from schema
export * from "./enums";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
};

const softDelete = {
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. USERS
// ═══════════════════════════════════════════════════════════════════════════════
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash"),
    name: varchar("name", { length: 255 }),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").notNull().default("user"),
    emailVerified: boolean("email_verified").notNull().default(false),
    ...timestamps,
    ...softDelete,
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    index("users_role_idx").on(t.role),
    index("users_created_at_idx").on(t.createdAt),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PROFILES
// ═══════════════════════════════════════════════════════════════════════════════
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bio: text("bio"),
    website: varchar("website", { length: 512 }),
    socialLinks: jsonb("social_links").$type<Record<string, string>>(),
    preferredLanguage: varchar("preferred_language", { length: 10 }).default(
      "es",
    ),
    preferredCurrency: varchar("preferred_currency", { length: 3 }).default(
      "MXN",
    ),
    travelStyle: varchar("travel_style", { length: 100 }),
    vehicleType: varchar("vehicle_type", { length: 100 }),
    ...timestamps,
  },
  (t) => [uniqueIndex("profiles_user_id_idx").on(t.userId)],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SUBSCRIPTION PLANS
// ═══════════════════════════════════════════════════════════════════════════════
export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    priceMonthlyCents: integer("price_monthly_cents").notNull().default(0),
    priceAnnualCents: integer("price_annual_cents").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
    stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 255 }),
    stripePriceIdAnnual: varchar("stripe_price_id_annual", { length: 255 }),
    maxSavedTrips: integer("max_saved_trips"),
    maxStopsPerTrip: integer("max_stops_per_trip"),
    features: jsonb("features").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("subscription_plans_slug_idx").on(t.slug)],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: "restrict" }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end")
      .notNull()
      .default(false),
    ...timestamps,
  },
  (t) => [
    index("subscriptions_user_id_idx").on(t.userId),
    index("subscriptions_plan_id_idx").on(t.planId),
    index("subscriptions_status_idx").on(t.status),
    uniqueIndex("subscriptions_stripe_sub_id_idx").on(t.stripeSubscriptionId),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ENTITLEMENTS
// ═══════════════════════════════════════════════════════════════════════════════
export const entitlements = pgTable(
  "entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: "cascade" }),
    featureKey: varchar("feature_key", { length: 200 }).notNull(),
    featureValue: jsonb("feature_value"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("entitlements_plan_id_idx").on(t.planId),
    uniqueIndex("entitlements_plan_feature_idx").on(t.planId, t.featureKey),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 6. BILLING EVENTS
// ═══════════════════════════════════════════════════════════════════════════════
export const billingEvents = pgTable(
  "billing_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    subscriptionId: uuid("subscription_id").references(
      () => subscriptions.id,
      { onDelete: "set null" },
    ),
    stripeEventId: varchar("stripe_event_id", { length: 255 }),
    eventType: varchar("event_type", { length: 200 }).notNull(),
    amountCents: integer("amount_cents"),
    currency: varchar("currency", { length: 3 }).default("MXN"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("billing_events_user_id_idx").on(t.userId),
    index("billing_events_subscription_id_idx").on(t.subscriptionId),
    uniqueIndex("billing_events_stripe_event_id_idx").on(t.stripeEventId),
    index("billing_events_created_at_idx").on(t.createdAt),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 7. PLACE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════
export const placeCategories = pgTable(
  "place_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 150 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    nameEn: varchar("name_en", { length: 200 }),
    icon: varchar("icon", { length: 100 }),
    color: varchar("color", { length: 30 }),
    parentId: uuid("parent_id"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("place_categories_slug_idx").on(t.slug),
    index("place_categories_parent_id_idx").on(t.parentId),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 8. PLACES
// ═══════════════════════════════════════════════════════════════════════════════
export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 400 }).notNull(),
    name: varchar("name", { length: 400 }).notNull(),
    nameAlt: varchar("name_alt", { length: 400 }),
    shortDescription: text("short_description"),
    longDescription: text("long_description"),

    // Geospatial — stored as separate double precision columns
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

    // Administrative geography
    state: varchar("state", { length: 200 }),
    municipality: varchar("municipality", { length: 200 }),
    locality: varchar("locality", { length: 200 }),
    address: text("address"),
    postalCode: varchar("postal_code", { length: 10 }),

    // Classification
    categoryId: uuid("category_id").references(() => placeCategories.id, {
      onDelete: "set null",
    }),
    subcategoryIds: jsonb("subcategory_ids").$type<string[]>(),
    badges: jsonb("badges").$type<string[]>(),

    // Data quality
    sourcePriority: integer("source_priority").default(0),
    confidenceScore: integer("confidence_score").default(0),

    // Publishing
    isPublished: boolean("is_published").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    isSponsored: boolean("is_sponsored").notNull().default(false),
    editorialNotes: text("editorial_notes"),

    // Media & contact
    primaryImageUrl: text("primary_image_url"),
    website: varchar("website", { length: 512 }),
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 320 }),

    // Structured data
    openingHours: jsonb("opening_hours"),
    priceInfo: jsonb("price_info"),
    accessibilityInfo: text("accessibility_info"),
    petFriendly: boolean("pet_friendly"),
    familyFriendly: boolean("family_friendly"),
    budgetLevel: budgetLevelEnum("budget_level"),

    // SEO
    metaTitle: varchar("meta_title", { length: 200 }),
    metaDescription: varchar("meta_description", { length: 500 }),
    richnessScore: integer("richness_score").default(0),

    ...timestamps,
    ...softDelete,
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("places_slug_idx").on(t.slug),
    index("places_category_id_idx").on(t.categoryId),
    index("places_state_idx").on(t.state),
    index("places_is_published_idx").on(t.isPublished),
    index("places_is_featured_idx").on(t.isFeatured),
    index("places_budget_level_idx").on(t.budgetLevel),
    index("places_created_at_idx").on(t.createdAt),
    // Geospatial composite index for bounding-box queries
    index("places_lat_lng_idx").on(t.latitude, t.longitude),
    // Richness score for content quality sorting
    index("places_richness_score_idx").on(t.richnessScore),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 9. PLACE SOURCES
// ═══════════════════════════════════════════════════════════════════════════════
export const placeSources = pgTable(
  "place_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    sourceName: varchar("source_name", { length: 100 }).notNull(),
    sourceId: varchar("source_id", { length: 255 }),
    sourceUrl: text("source_url"),
    sourceData: jsonb("source_data"),
    sourceHash: varchar("source_hash", { length: 64 }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("place_sources_place_id_idx").on(t.placeId),
    index("place_sources_source_name_idx").on(t.sourceName),
    uniqueIndex("place_sources_source_name_source_id_idx").on(
      t.sourceName,
      t.sourceId,
    ),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 10. PLACE IMAGES
// ═══════════════════════════════════════════════════════════════════════════════
export const placeImages = pgTable(
  "place_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    altText: varchar("alt_text", { length: 500 }),
    caption: text("caption"),
    credit: varchar("credit", { length: 300 }),
    isPrimary: boolean("is_primary").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("place_images_place_id_idx").on(t.placeId),
    index("place_images_is_primary_idx").on(t.isPrimary),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 11. PLACE TAGS
// ═══════════════════════════════════════════════════════════════════════════════
export const placeTags = pgTable(
  "place_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("place_tags_place_id_idx").on(t.placeId),
    index("place_tags_tag_idx").on(t.tag),
    uniqueIndex("place_tags_place_tag_idx").on(t.placeId, t.tag),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 12. PLACE REVIEWS
// ═══════════════════════════════════════════════════════════════════════════════
export const placeReviews = pgTable(
  "place_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 300 }),
    body: text("body"),
    isApproved: boolean("is_approved").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    ...timestamps,
    ...softDelete,
  },
  (t) => [
    index("place_reviews_place_id_idx").on(t.placeId),
    index("place_reviews_user_id_idx").on(t.userId),
    index("place_reviews_rating_idx").on(t.rating),
    index("place_reviews_is_approved_idx").on(t.isApproved),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 13. TRIPS
// ═══════════════════════════════════════════════════════════════════════════════
export const trips = pgTable(
  "trips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 400 }).notNull(),
    slug: varchar("slug", { length: 400 }).notNull(),
    description: text("description"),

    // Origin
    originName: varchar("origin_name", { length: 400 }),
    originLat: doublePrecision("origin_lat"),
    originLng: doublePrecision("origin_lng"),

    // Destination
    destinationName: varchar("destination_name", { length: 400 }),
    destinationLat: doublePrecision("destination_lat"),
    destinationLng: doublePrecision("destination_lng"),

    // Status
    status: tripStatusEnum("status").notNull().default("draft"),
    isPublic: boolean("is_public").notNull().default(false),
    shareToken: varchar("share_token", { length: 64 }),

    // Routing preferences
    vehicleType: varchar("vehicle_type", { length: 100 }),
    avoidTolls: boolean("avoid_tolls").notNull().default(false),
    avoidHighways: boolean("avoid_highways").notNull().default(false),
    avoidFerries: boolean("avoid_ferries").notNull().default(false),
    avoidDirtRoads: boolean("avoid_dirt_roads").notNull().default(false),

    // Aggregates
    totalDistanceKm: doublePrecision("total_distance_km"),
    totalDurationMinutes: integer("total_duration_minutes"),
    totalCostEstimateCents: integer("total_cost_estimate_cents"),
    currency: varchar("currency", { length: 3 }).default("MXN"),

    ...timestamps,
    ...softDelete,
  },
  (t) => [
    index("trips_user_id_idx").on(t.userId),
    index("trips_status_idx").on(t.status),
    index("trips_is_public_idx").on(t.isPublic),
    uniqueIndex("trips_slug_idx").on(t.slug),
    uniqueIndex("trips_share_token_idx").on(t.shareToken),
    index("trips_created_at_idx").on(t.createdAt),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 14. TRIP DAYS
// ═══════════════════════════════════════════════════════════════════════════════
export const tripDays = pgTable(
  "trip_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    date: date("date"),
    title: varchar("title", { length: 300 }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("trip_days_trip_id_idx").on(t.tripId),
    uniqueIndex("trip_days_trip_day_idx").on(t.tripId, t.dayNumber),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 15. TRIP STOPS
// ═══════════════════════════════════════════════════════════════════════════════
export const tripStops = pgTable(
  "trip_stops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    tripDayId: uuid("trip_day_id").references(() => tripDays.id, {
      onDelete: "set null",
    }),
    placeId: uuid("place_id").references(() => places.id, {
      onDelete: "set null",
    }),
    customName: varchar("custom_name", { length: 400 }),
    customLat: doublePrecision("custom_lat"),
    customLng: doublePrecision("custom_lng"),
    sortOrder: integer("sort_order").notNull().default(0),
    notes: text("notes"),
    arrivalTime: timestamp("arrival_time", { withTimezone: true }),
    departureTime: timestamp("departure_time", { withTimezone: true }),
    durationMinutes: integer("duration_minutes"),
    budgetCents: integer("budget_cents"),
    isWaypointOnly: boolean("is_waypoint_only").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("trip_stops_trip_id_idx").on(t.tripId),
    index("trip_stops_trip_day_id_idx").on(t.tripDayId),
    index("trip_stops_place_id_idx").on(t.placeId),
    index("trip_stops_sort_order_idx").on(t.tripId, t.sortOrder),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 16. TRIP COLLABORATORS
// ═══════════════════════════════════════════════════════════════════════════════
export const tripCollaborators = pgTable(
  "trip_collaborators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    role: tripCollaboratorRoleEnum("role").notNull().default("viewer"),
    invitedEmail: varchar("invited_email", { length: 320 }),
    inviteToken: varchar("invite_token", { length: 64 }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("trip_collaborators_trip_id_idx").on(t.tripId),
    index("trip_collaborators_user_id_idx").on(t.userId),
    uniqueIndex("trip_collaborators_invite_token_idx").on(t.inviteToken),
    uniqueIndex("trip_collaborators_trip_user_idx").on(t.tripId, t.userId),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 17. TRIP NOTES
// ═══════════════════════════════════════════════════════════════════════════════
export const tripNotes = pgTable(
  "trip_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    ...timestamps,
  },
  (t) => [
    index("trip_notes_trip_id_idx").on(t.tripId),
    index("trip_notes_user_id_idx").on(t.userId),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 18. SAVED PLACES
// ═══════════════════════════════════════════════════════════════════════════════
export const savedPlaces = pgTable(
  "saved_places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id").references(() => collections.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("saved_places_user_id_idx").on(t.userId),
    index("saved_places_place_id_idx").on(t.placeId),
    index("saved_places_collection_id_idx").on(t.collectionId),
    uniqueIndex("saved_places_user_place_idx").on(t.userId, t.placeId),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 19. COLLECTIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    slug: varchar("slug", { length: 300 }).notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    isPublic: boolean("is_public").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    type: collectionTypeEnum("type").notNull().default("user"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("collections_slug_idx").on(t.slug),
    index("collections_user_id_idx").on(t.userId),
    index("collections_type_idx").on(t.type),
    index("collections_is_public_idx").on(t.isPublic),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 20. COLLECTION PLACES
// ═══════════════════════════════════════════════════════════════════════════════
export const collectionPlaces = pgTable(
  "collection_places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    editorialNote: text("editorial_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("collection_places_collection_id_idx").on(t.collectionId),
    index("collection_places_place_id_idx").on(t.placeId),
    uniqueIndex("collection_places_collection_place_idx").on(
      t.collectionId,
      t.placeId,
    ),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 21. ROUTE SNAPSHOTS
// ═══════════════════════════════════════════════════════════════════════════════
export const routeSnapshots = pgTable(
  "route_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    geometryJson: text("geometry_json"),
    provider: varchar("provider", { length: 100 }),
    totalDistanceKm: doublePrecision("total_distance_km"),
    totalDurationMinutes: integer("total_duration_minutes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("route_snapshots_trip_id_idx").on(t.tripId)],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 22. ROUTE SEGMENTS
// ═══════════════════════════════════════════════════════════════════════════════
export const routeSegments = pgTable(
  "route_segments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    routeSnapshotId: uuid("route_snapshot_id")
      .notNull()
      .references(() => routeSnapshots.id, { onDelete: "cascade" }),
    segmentOrder: integer("segment_order").notNull(),
    fromStopId: uuid("from_stop_id").references(() => tripStops.id, {
      onDelete: "set null",
    }),
    toStopId: uuid("to_stop_id").references(() => tripStops.id, {
      onDelete: "set null",
    }),
    distanceKm: doublePrecision("distance_km"),
    durationMinutes: integer("duration_minutes"),
    tollCostCents: integer("toll_cost_cents"),
    fuelCostCents: integer("fuel_cost_cents"),
    geometryJson: text("geometry_json"),
    instructions: jsonb("instructions"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("route_segments_route_snapshot_id_idx").on(t.routeSnapshotId),
    index("route_segments_segment_order_idx").on(
      t.routeSnapshotId,
      t.segmentOrder,
    ),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 23. VEHICLE PROFILES
// ═══════════════════════════════════════════════════════════════════════════════
export const vehicleProfiles = pgTable(
  "vehicle_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    type: vehicleTypeEnum("type").notNull(),
    fuelType: varchar("fuel_type", { length: 50 }),
    fuelEfficiencyKmPerLiter: doublePrecision("fuel_efficiency_km_per_liter"),
    tankCapacityLiters: doublePrecision("tank_capacity_liters"),
    ...timestamps,
  },
  (t) => [index("vehicle_profiles_user_id_idx").on(t.userId)],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 24. AI TRIP RUNS
// ═══════════════════════════════════════════════════════════════════════════════
export const aiTripRuns = pgTable(
  "ai_trip_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tripId: uuid("trip_id").references(() => trips.id, {
      onDelete: "set null",
    }),
    inputParams: jsonb("input_params"),
    inputHash: varchar("input_hash", { length: 64 }),
    status: aiRunStatusEnum("status").notNull().default("pending"),
    result: jsonb("result"),
    feedbackScore: integer("feedback_score"),
    feedbackNotes: text("feedback_notes"),
    modelUsed: varchar("model_used", { length: 100 }),
    tokensUsed: integer("tokens_used"),
    costCents: integer("cost_cents"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("ai_trip_runs_user_id_idx").on(t.userId),
    index("ai_trip_runs_trip_id_idx").on(t.tripId),
    index("ai_trip_runs_status_idx").on(t.status),
    index("ai_trip_runs_created_at_idx").on(t.createdAt),
    index("ai_trip_runs_input_hash_idx").on(t.inputHash),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 25. CONTENT ARTICLES
// ═══════════════════════════════════════════════════════════════════════════════
export const contentArticles = pgTable(
  "content_articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 400 }).notNull(),
    title: varchar("title", { length: 400 }).notNull(),
    subtitle: varchar("subtitle", { length: 400 }),
    body: text("body"),
    excerpt: text("excerpt"),
    coverImageUrl: text("cover_image_url"),
    authorName: varchar("author_name", { length: 200 }),
    authorBio: text("author_bio"),
    authorAvatarUrl: text("author_avatar_url"),
    category: varchar("category", { length: 100 }),
    tags: jsonb("tags").$type<string[]>(),
    isPublished: boolean("is_published").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    metaTitle: varchar("meta_title", { length: 200 }),
    metaDescription: varchar("meta_description", { length: 500 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("content_articles_slug_idx").on(t.slug),
    index("content_articles_category_idx").on(t.category),
    index("content_articles_is_published_idx").on(t.isPublished),
    index("content_articles_is_featured_idx").on(t.isFeatured),
    index("content_articles_published_at_idx").on(t.publishedAt),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 26. CONTENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════
export const contentRoutes = pgTable(
  "content_routes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 400 }).notNull(),
    title: varchar("title", { length: 400 }).notNull(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    originName: varchar("origin_name", { length: 400 }),
    destinationName: varchar("destination_name", { length: 400 }),
    states: jsonb("states").$type<string[]>(),
    durationDays: integer("duration_days"),
    distanceKm: doublePrecision("distance_km"),
    difficulty: varchar("difficulty", { length: 50 }),
    highlights: jsonb("highlights").$type<string[]>(),
    isPublished: boolean("is_published").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    metaTitle: varchar("meta_title", { length: 200 }),
    metaDescription: varchar("meta_description", { length: 500 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("content_routes_slug_idx").on(t.slug),
    index("content_routes_is_published_idx").on(t.isPublished),
    index("content_routes_is_featured_idx").on(t.isFeatured),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 27. CONTENT ROUTE PLACES
// ═══════════════════════════════════════════════════════════════════════════════
export const contentRoutePlaces = pgTable(
  "content_route_places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentRouteId: uuid("content_route_id")
      .notNull()
      .references(() => contentRoutes.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    editorialNote: text("editorial_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("content_route_places_route_id_idx").on(t.contentRouteId),
    index("content_route_places_place_id_idx").on(t.placeId),
    uniqueIndex("content_route_places_route_place_idx").on(
      t.contentRouteId,
      t.placeId,
    ),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 28. SEO PAGES
// ═══════════════════════════════════════════════════════════════════════════════
export const seoPages = pgTable(
  "seo_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    path: varchar("path", { length: 1000 }).notNull(),
    pageType: varchar("page_type", { length: 100 }),
    entityId: uuid("entity_id"),
    metaTitle: varchar("meta_title", { length: 200 }),
    metaDescription: varchar("meta_description", { length: 500 }),
    h1: varchar("h1", { length: 300 }),
    introText: text("intro_text"),
    isIndexable: boolean("is_indexable").notNull().default(true),
    richnessScore: integer("richness_score").default(0),
    canonicalUrl: text("canonical_url"),
    primaryKeyword: varchar("primary_keyword", { length: 200 }),
    secondaryKeywords: jsonb("secondary_keywords").$type<string[]>(),
    keywordCluster: varchar("keyword_cluster", { length: 200 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("seo_pages_path_idx").on(t.path),
    index("seo_pages_page_type_idx").on(t.pageType),
    index("seo_pages_entity_id_idx").on(t.entityId),
    index("seo_pages_keyword_cluster_idx").on(t.keywordCluster),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 29. IMPORT RUNS
// ═══════════════════════════════════════════════════════════════════════════════
export const importRuns = pgTable(
  "import_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceName: varchar("source_name", { length: 100 }).notNull(),
    status: importRunStatusEnum("status").notNull().default("pending"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    totalRecords: integer("total_records"),
    inserted: integer("inserted"),
    updated: integer("updated"),
    skipped: integer("skipped"),
    errors: integer("errors"),
    dryRun: boolean("dry_run").notNull().default(false),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("import_runs_source_name_idx").on(t.sourceName),
    index("import_runs_status_idx").on(t.status),
    index("import_runs_created_at_idx").on(t.createdAt),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 30. IMPORT ERRORS
// ═══════════════════════════════════════════════════════════════════════════════
export const importErrors = pgTable(
  "import_errors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    importRunId: uuid("import_run_id")
      .notNull()
      .references(() => importRuns.id, { onDelete: "cascade" }),
    recordIdentifier: varchar("record_identifier", { length: 500 }),
    errorType: varchar("error_type", { length: 200 }),
    errorMessage: text("error_message"),
    rawData: jsonb("raw_data"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("import_errors_import_run_id_idx").on(t.importRunId),
    index("import_errors_error_type_idx").on(t.errorType),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 31. AFFILIATE CLICKS
// ═══════════════════════════════════════════════════════════════════════════════
export const affiliateClicks = pgTable(
  "affiliate_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    placeId: uuid("place_id").references(() => places.id, {
      onDelete: "set null",
    }),
    partner: varchar("partner", { length: 200 }).notNull(),
    destinationUrl: text("destination_url").notNull(),
    utmParams: jsonb("utm_params"),
    referrer: text("referrer"),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("affiliate_clicks_user_id_idx").on(t.userId),
    index("affiliate_clicks_place_id_idx").on(t.placeId),
    index("affiliate_clicks_partner_idx").on(t.partner),
    index("affiliate_clicks_created_at_idx").on(t.createdAt),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 32. SPONSORED PLACEMENTS
// ═══════════════════════════════════════════════════════════════════════════════
export const sponsoredPlacements = pgTable(
  "sponsored_placements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    campaignName: varchar("campaign_name", { length: 300 }).notNull(),
    placementType: placementTypeEnum("placement_type").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    budgetCents: integer("budget_cents"),
    spentCents: integer("spent_cents").notNull().default(0),
    impressions: integer("impressions").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("sponsored_placements_place_id_idx").on(t.placeId),
    index("sponsored_placements_is_active_idx").on(t.isActive),
    index("sponsored_placements_placement_type_idx").on(t.placementType),
    index("sponsored_placements_start_end_idx").on(t.startDate, t.endDate),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 33. MEMBER DEALS
// ═══════════════════════════════════════════════════════════════════════════════
export const memberDeals = pgTable(
  "member_deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 400 }).notNull(),
    description: text("description"),
    partnerName: varchar("partner_name", { length: 300 }).notNull(),
    dealCode: varchar("deal_code", { length: 100 }),
    redirectUrl: text("redirect_url"),
    discountPercent: integer("discount_percent"),
    discountAmountCents: integer("discount_amount_cents"),
    minPlanRequired: varchar("min_plan_required", { length: 100 }),
    placeId: uuid("place_id").references(() => places.id, {
      onDelete: "set null",
    }),
    category: varchar("category", { length: 100 }),
    coverImageUrl: text("cover_image_url"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("member_deals_place_id_idx").on(t.placeId),
    index("member_deals_is_active_idx").on(t.isActive),
    index("member_deals_category_idx").on(t.category),
    index("member_deals_expires_at_idx").on(t.expiresAt),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 34. FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════════════════════
export const featureFlags = pgTable(
  "feature_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 200 }).notNull(),
    description: text("description"),
    isEnabled: boolean("is_enabled").notNull().default(false),
    conditions: jsonb("conditions"),
    ...timestamps,
  },
  (t) => [uniqueIndex("feature_flags_key_idx").on(t.key)],
);

// ═══════════════════════════════════════════════════════════════════════════════
// 35. AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════════════
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 200 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }),
    entityId: varchar("entity_id", { length: 255 }),
    oldData: jsonb("old_data"),
    newData: jsonb("new_data"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_logs_user_id_idx").on(t.userId),
    index("audit_logs_entity_type_idx").on(t.entityType),
    index("audit_logs_entity_id_idx").on(t.entityId),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ],
);

// ═══════════════════════════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  subscriptions: many(subscriptions),
  trips: many(trips),
  savedPlaces: many(savedPlaces),
  collections: many(collections),
  vehicleProfiles: many(vehicleProfiles),
  placeReviews: many(placeReviews),
  aiTripRuns: many(aiTripRuns),
  tripCollaborators: many(tripCollaborators),
  tripNotes: many(tripNotes),
  billingEvents: many(billingEvents),
  auditLogs: many(auditLogs),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const subscriptionPlansRelations = relations(
  subscriptionPlans,
  ({ many }) => ({
    subscriptions: many(subscriptions),
    entitlements: many(entitlements),
  }),
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const entitlementsRelations = relations(entitlements, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [entitlements.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const billingEventsRelations = relations(billingEvents, ({ one }) => ({
  user: one(users, {
    fields: [billingEvents.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [billingEvents.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const placeCategoriesRelations = relations(
  placeCategories,
  ({ one, many }) => ({
    parent: one(placeCategories, {
      fields: [placeCategories.parentId],
      references: [placeCategories.id],
      relationName: "categoryParent",
    }),
    children: many(placeCategories, { relationName: "categoryParent" }),
    places: many(places),
  }),
);

export const placesRelations = relations(places, ({ one, many }) => ({
  category: one(placeCategories, {
    fields: [places.categoryId],
    references: [placeCategories.id],
  }),
  sources: many(placeSources),
  images: many(placeImages),
  tags: many(placeTags),
  reviews: many(placeReviews),
  tripStops: many(tripStops),
  savedPlaces: many(savedPlaces),
  collectionPlaces: many(collectionPlaces),
  contentRoutePlaces: many(contentRoutePlaces),
  affiliateClicks: many(affiliateClicks),
  sponsoredPlacements: many(sponsoredPlacements),
  memberDeals: many(memberDeals),
}));

export const placeSourcesRelations = relations(placeSources, ({ one }) => ({
  place: one(places, {
    fields: [placeSources.placeId],
    references: [places.id],
  }),
}));

export const placeImagesRelations = relations(placeImages, ({ one }) => ({
  place: one(places, {
    fields: [placeImages.placeId],
    references: [places.id],
  }),
}));

export const placeTagsRelations = relations(placeTags, ({ one }) => ({
  place: one(places, {
    fields: [placeTags.placeId],
    references: [places.id],
  }),
}));

export const placeReviewsRelations = relations(placeReviews, ({ one }) => ({
  place: one(places, {
    fields: [placeReviews.placeId],
    references: [places.id],
  }),
  user: one(users, {
    fields: [placeReviews.userId],
    references: [users.id],
  }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  days: many(tripDays),
  stops: many(tripStops),
  collaborators: many(tripCollaborators),
  notes: many(tripNotes),
  routeSnapshots: many(routeSnapshots),
  aiTripRuns: many(aiTripRuns),
}));

export const tripDaysRelations = relations(tripDays, ({ one, many }) => ({
  trip: one(trips, {
    fields: [tripDays.tripId],
    references: [trips.id],
  }),
  stops: many(tripStops),
}));

export const tripStopsRelations = relations(tripStops, ({ one }) => ({
  trip: one(trips, {
    fields: [tripStops.tripId],
    references: [trips.id],
  }),
  tripDay: one(tripDays, {
    fields: [tripStops.tripDayId],
    references: [tripDays.id],
  }),
  place: one(places, {
    fields: [tripStops.placeId],
    references: [places.id],
  }),
}));

export const tripCollaboratorsRelations = relations(
  tripCollaborators,
  ({ one }) => ({
    trip: one(trips, {
      fields: [tripCollaborators.tripId],
      references: [trips.id],
    }),
    user: one(users, {
      fields: [tripCollaborators.userId],
      references: [users.id],
    }),
  }),
);

export const tripNotesRelations = relations(tripNotes, ({ one }) => ({
  trip: one(trips, {
    fields: [tripNotes.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripNotes.userId],
    references: [users.id],
  }),
}));

export const savedPlacesRelations = relations(savedPlaces, ({ one }) => ({
  user: one(users, {
    fields: [savedPlaces.userId],
    references: [users.id],
  }),
  place: one(places, {
    fields: [savedPlaces.placeId],
    references: [places.id],
  }),
  collection: one(collections, {
    fields: [savedPlaces.collectionId],
    references: [collections.id],
  }),
}));

export const collectionsRelations = relations(
  collections,
  ({ one, many }) => ({
    user: one(users, {
      fields: [collections.userId],
      references: [users.id],
    }),
    places: many(collectionPlaces),
    savedPlaces: many(savedPlaces),
  }),
);

export const collectionPlacesRelations = relations(
  collectionPlaces,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionPlaces.collectionId],
      references: [collections.id],
    }),
    place: one(places, {
      fields: [collectionPlaces.placeId],
      references: [places.id],
    }),
  }),
);

export const routeSnapshotsRelations = relations(
  routeSnapshots,
  ({ one, many }) => ({
    trip: one(trips, {
      fields: [routeSnapshots.tripId],
      references: [trips.id],
    }),
    segments: many(routeSegments),
  }),
);

export const routeSegmentsRelations = relations(routeSegments, ({ one }) => ({
  routeSnapshot: one(routeSnapshots, {
    fields: [routeSegments.routeSnapshotId],
    references: [routeSnapshots.id],
  }),
  fromStop: one(tripStops, {
    fields: [routeSegments.fromStopId],
    references: [tripStops.id],
    relationName: "fromStop",
  }),
  toStop: one(tripStops, {
    fields: [routeSegments.toStopId],
    references: [tripStops.id],
    relationName: "toStop",
  }),
}));

export const vehicleProfilesRelations = relations(
  vehicleProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [vehicleProfiles.userId],
      references: [users.id],
    }),
  }),
);

export const aiTripRunsRelations = relations(aiTripRuns, ({ one }) => ({
  user: one(users, {
    fields: [aiTripRuns.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [aiTripRuns.tripId],
    references: [trips.id],
  }),
}));

export const contentArticlesRelations = relations(
  contentArticles,
  () => ({}),
);

export const contentRoutesRelations = relations(
  contentRoutes,
  ({ many }) => ({
    places: many(contentRoutePlaces),
  }),
);

export const contentRoutePlacesRelations = relations(
  contentRoutePlaces,
  ({ one }) => ({
    contentRoute: one(contentRoutes, {
      fields: [contentRoutePlaces.contentRouteId],
      references: [contentRoutes.id],
    }),
    place: one(places, {
      fields: [contentRoutePlaces.placeId],
      references: [places.id],
    }),
  }),
);

export const importRunsRelations = relations(importRuns, ({ many }) => ({
  errors: many(importErrors),
}));

export const importErrorsRelations = relations(importErrors, ({ one }) => ({
  importRun: one(importRuns, {
    fields: [importErrors.importRunId],
    references: [importRuns.id],
  }),
}));

export const affiliateClicksRelations = relations(
  affiliateClicks,
  ({ one }) => ({
    user: one(users, {
      fields: [affiliateClicks.userId],
      references: [users.id],
    }),
    place: one(places, {
      fields: [affiliateClicks.placeId],
      references: [places.id],
    }),
  }),
);

export const sponsoredPlacementsRelations = relations(
  sponsoredPlacements,
  ({ one }) => ({
    place: one(places, {
      fields: [sponsoredPlacements.placeId],
      references: [places.id],
    }),
  }),
);

export const memberDealsRelations = relations(memberDeals, ({ one }) => ({
  place: one(places, {
    fields: [memberDeals.placeId],
    references: [places.id],
  }),
}));

export const seoPagesRelations = relations(seoPages, () => ({}));

export const featureFlagsRelations = relations(featureFlags, () => ({}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// 35. SOCIAL — "Conectar" (premium-only)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Perfil público ligero que el usuario llena en <1 min para participar en la
 * sección social. Vive en su propia tabla para no ensuciar `users`/`profiles`
 * con columnas solo relevantes al módulo social y facilitar ocultar un perfil
 * social sin tocar la identidad base.
 */
export const socialProfiles = pgTable(
  "social_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 80 }).notNull(),
    bio: varchar("bio", { length: 280 }),
    photoUrl: text("photo_url"),
    destinoEstadoSlug: varchar("destino_estado_slug", { length: 64 }),
    interests: jsonb("interests").$type<string[]>().default([]).notNull(),
    intent: socialIntentEnum("intent"),
    age: integer("age"),
    languages: jsonb("languages").$type<string[]>().default([]).notNull(),
    travelFrom: date("travel_from"),
    travelTo: date("travel_to"),
    isVisible: boolean("is_visible").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("social_profiles_user_id_idx").on(t.userId),
    index("social_profiles_visible_idx").on(t.isVisible),
    index("social_profiles_destino_idx").on(t.destinoEstadoSlug),
  ],
);

export const socialSwipes = pgTable(
  "social_swipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: socialSwipeActionEnum("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("social_swipes_pair_uq").on(t.fromUserId, t.toUserId),
    index("social_swipes_to_user_idx").on(t.toUserId),
    index("social_swipes_action_idx").on(t.action),
  ],
);

/**
 * Un match se crea cuando dos usuarios dan `like` mutuamente. Almacenamos el
 * par con `userAId < userBId` por convención para que un único par tenga
 * exactamente una fila (independientemente de quién likó primero).
 */
export const socialMatches = pgTable(
  "social_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userAId: uuid("user_a_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userBId: uuid("user_b_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    /** Usuario que cerró/rompió el match (bloqueo o unmatch). Null = activo. */
    closedByUserId: uuid("closed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("social_matches_pair_uq").on(t.userAId, t.userBId),
    index("social_matches_user_a_idx").on(t.userAId),
    index("social_matches_user_b_idx").on(t.userBId),
    index("social_matches_last_msg_idx").on(t.lastMessageAt),
  ],
);

export const socialMessages = pgTable(
  "social_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => socialMatches.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: varchar("body", { length: 2000 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [
    index("social_messages_match_idx").on(t.matchId),
    index("social_messages_sender_idx").on(t.senderId),
    index("social_messages_created_idx").on(t.createdAt),
  ],
);

export const socialBlocks = pgTable(
  "social_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("social_blocks_pair_uq").on(t.blockerId, t.blockedId),
    index("social_blocks_blocked_idx").on(t.blockedId),
  ],
);

export const socialReports = pgTable(
  "social_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportedId: uuid("reported_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: varchar("reason", { length: 80 }).notNull(),
    note: varchar("note", { length: 1000 }),
    status: socialReportStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    index("social_reports_reported_idx").on(t.reportedId),
    index("social_reports_status_idx").on(t.status),
  ],
);

// ── Social relations ────────────────────────────────────────────────────────
export const socialProfilesRelations = relations(socialProfiles, ({ one }) => ({
  user: one(users, {
    fields: [socialProfiles.userId],
    references: [users.id],
  }),
}));

export const socialSwipesRelations = relations(socialSwipes, ({ one }) => ({
  from: one(users, {
    fields: [socialSwipes.fromUserId],
    references: [users.id],
    relationName: "social_swipe_from",
  }),
  to: one(users, {
    fields: [socialSwipes.toUserId],
    references: [users.id],
    relationName: "social_swipe_to",
  }),
}));

export const socialMatchesRelations = relations(socialMatches, ({ one, many }) => ({
  userA: one(users, {
    fields: [socialMatches.userAId],
    references: [users.id],
    relationName: "social_match_a",
  }),
  userB: one(users, {
    fields: [socialMatches.userBId],
    references: [users.id],
    relationName: "social_match_b",
  }),
  messages: many(socialMessages),
}));

export const socialMessagesRelations = relations(socialMessages, ({ one }) => ({
  match: one(socialMatches, {
    fields: [socialMessages.matchId],
    references: [socialMatches.id],
  }),
  sender: one(users, {
    fields: [socialMessages.senderId],
    references: [users.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// 36. SOCIAL COMMUNITIES — foros / grupos / canales (premium-only)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Unified community container.
 *
 * `type = 'forum'`   → editorial, open membership, seeded by staff
 * `type = 'group'`   → user-created, joinable (optionally requires approval)
 * `type = 'channel'` → editorial broadcast; only moderators can post
 */
export const socialCommunities = pgTable(
  "social_communities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: socialCommunityTypeEnum("type").notNull(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    description: varchar("description", { length: 600 }),
    coverPhotoUrl: text("cover_photo_url"),
    isPublic: boolean("is_public").notNull().default(true),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    /** Null for editorial/seeded content. */
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    memberCount: integer("member_count").notNull().default(0),
    postCount: integer("post_count").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("social_communities_type_idx").on(t.type),
    index("social_communities_slug_idx").on(t.slug),
  ],
);

export const socialCommunityMembers = pgTable(
  "social_community_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => socialCommunities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: socialCommunityRoleEnum("role").notNull().default("member"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("social_community_members_pair_uq").on(t.communityId, t.userId),
    index("social_community_members_user_idx").on(t.userId),
    index("social_community_members_role_idx").on(t.role),
  ],
);

export const socialCommunityPosts = pgTable(
  "social_community_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => socialCommunities.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    body: varchar("body", { length: 8000 }).notNull(),
    /** JSON array of uploaded photo URLs (already validated). */
    photoUrls: jsonb("photo_urls").$type<string[]>().default([]).notNull(),
    /** SHA-256 hashes of photos, for quick abuse-hash lookups. */
    photoHashes: jsonb("photo_hashes").$type<string[]>().default([]).notNull(),
    status: socialContentStatusEnum("status").notNull().default("published"),
    isPinned: boolean("is_pinned").notNull().default(false),
    isLocked: boolean("is_locked").notNull().default(false),
    upvoteCount: integer("upvote_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    flagCount: integer("flag_count").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("social_community_posts_community_idx").on(t.communityId),
    index("social_community_posts_author_idx").on(t.authorId),
    index("social_community_posts_status_idx").on(t.status),
    index("social_community_posts_created_idx").on(t.createdAt),
  ],
);

export const socialCommunityComments = pgTable(
  "social_community_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => socialCommunityPosts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentCommentId: uuid("parent_comment_id"),
    body: varchar("body", { length: 4000 }).notNull(),
    status: socialContentStatusEnum("status").notNull().default("published"),
    upvoteCount: integer("upvote_count").notNull().default(0),
    flagCount: integer("flag_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("social_community_comments_post_idx").on(t.postId),
    index("social_community_comments_author_idx").on(t.authorId),
    index("social_community_comments_status_idx").on(t.status),
  ],
);

export const socialCommunityVotes = pgTable(
  "social_community_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** One of these two will be set. Enforced at the app layer. */
    postId: uuid("post_id").references(() => socialCommunityPosts.id, {
      onDelete: "cascade",
    }),
    commentId: uuid("comment_id").references(() => socialCommunityComments.id, {
      onDelete: "cascade",
    }),
    value: integer("value").notNull(), // +1 upvote; -1 reserved for future
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("social_community_votes_user_post_uq").on(t.userId, t.postId),
    uniqueIndex("social_community_votes_user_comment_uq").on(
      t.userId,
      t.commentId,
    ),
  ],
);

/** Flags for content moderation (separate from user-to-user reports). */
export const socialContentFlags = pgTable(
  "social_content_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Exactly one of these is set. */
    postId: uuid("post_id").references(() => socialCommunityPosts.id, {
      onDelete: "cascade",
    }),
    commentId: uuid("comment_id").references(() => socialCommunityComments.id, {
      onDelete: "cascade",
    }),
    reason: varchar("reason", { length: 80 }).notNull(),
    note: varchar("note", { length: 1000 }),
    status: socialReportStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    index("social_content_flags_post_idx").on(t.postId),
    index("social_content_flags_comment_idx").on(t.commentId),
    index("social_content_flags_status_idx").on(t.status),
  ],
);

/** Audit log of every user-generated upload (for admin review + hash-block). */
export const socialUploads = pgTable(
  "social_uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    mime: varchar("mime", { length: 60 }).notNull(),
    width: integer("width"),
    height: integer("height"),
    size: integer("size"),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    scope: varchar("scope", { length: 40 }).notNull(), // 'avatar' | 'post' | 'cover'
    moderationStatus: socialContentStatusEnum("moderation_status")
      .notNull()
      .default("published"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("social_uploads_user_idx").on(t.userId),
    index("social_uploads_sha_idx").on(t.sha256),
    index("social_uploads_scope_idx").on(t.scope),
  ],
);

// ── Community relations ─────────────────────────────────────────────────────
export const socialCommunitiesRelations = relations(
  socialCommunities,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [socialCommunities.createdByUserId],
      references: [users.id],
    }),
    members: many(socialCommunityMembers),
    posts: many(socialCommunityPosts),
  }),
);

export const socialCommunityMembersRelations = relations(
  socialCommunityMembers,
  ({ one }) => ({
    community: one(socialCommunities, {
      fields: [socialCommunityMembers.communityId],
      references: [socialCommunities.id],
    }),
    user: one(users, {
      fields: [socialCommunityMembers.userId],
      references: [users.id],
    }),
  }),
);

export const socialCommunityPostsRelations = relations(
  socialCommunityPosts,
  ({ one, many }) => ({
    community: one(socialCommunities, {
      fields: [socialCommunityPosts.communityId],
      references: [socialCommunities.id],
    }),
    author: one(users, {
      fields: [socialCommunityPosts.authorId],
      references: [users.id],
    }),
    comments: many(socialCommunityComments),
  }),
);

export const socialCommunityCommentsRelations = relations(
  socialCommunityComments,
  ({ one }) => ({
    post: one(socialCommunityPosts, {
      fields: [socialCommunityComments.postId],
      references: [socialCommunityPosts.id],
    }),
    author: one(users, {
      fields: [socialCommunityComments.authorId],
      references: [users.id],
    }),
  }),
);
