import { db } from '@/db';
import { places, placeCategories } from '@/db/schema';
import { eq, and, gte, lte, isNotNull } from 'drizzle-orm';
import { haversineDistance } from '@/lib/utils';
import type { AutopilotInput, CandidatePlace } from './types';

// ── Constants ───────────────────────────────────────────────────────────────

const CORRIDOR_BUFFER_KM = 50;
const MAX_CANDIDATES = 100;
const STALE_THRESHOLD_DAYS = 180; // 6 months

/** Map budget input to compatible DB budget levels */
const BUDGET_COMPATIBILITY: Record<string, string[]> = {
  economico: ['free', 'budget'],
  moderado: ['free', 'budget', 'mid_range'],
  premium: ['free', 'budget', 'mid_range', 'premium'],
  lujo: ['free', 'budget', 'mid_range', 'premium', 'luxury'],
};

/** Category slugs grouped by AI style for scoring boosts */
const STYLE_CATEGORY_BOOSTS: Record<string, string[]> = {
  cultural: [
    'museos', 'zonas-arqueologicas', 'sitios-inah', 'centros-historicos',
    'haciendas', 'turismo-comunitario',
  ],
  foodie: [
    'mercados', 'restaurantes', 'cafeterias', 'comida-regional',
  ],
  familiar: [
    'parques-tematicos', 'balnearios', 'playas', 'cenotes',
  ],
  naturaleza: [
    'cascadas', 'bosques-sierras', 'areas-protegidas', 'cenotes',
    'grutas', 'miradores',
  ],
  express: [
    'paradas-utiles', 'gasolineras', 'pueblos-magicos',
  ],
  premium: [
    'vinedos', 'haciendas', 'glamping', 'tours-guias',
  ],
};

// ── Main retrieval function ─────────────────────────────────────────────────

/**
 * Retrieves candidate places from the DB that fall within the route corridor
 * and match the user's preferences. Returns up to MAX_CANDIDATES sorted by
 * composite relevance score.
 */
export async function retrieveCandidates(
  input: AutopilotInput,
): Promise<CandidatePlace[]> {
  const { origin, destination } = input;

  // Calculate a bounding box that encompasses the route corridor
  const bbox = calculateCorridorBoundingBox(origin, destination, CORRIDOR_BUFFER_KM);

  // Fetch places within the bounding box
  const rawPlaces = await db
    .select({
      id: places.id,
      slug: places.slug,
      name: places.name,
      shortDescription: places.shortDescription,
      latitude: places.latitude,
      longitude: places.longitude,
      state: places.state,
      categoryId: places.categoryId,
      badges: places.badges,
      budgetLevel: places.budgetLevel,
      isFeatured: places.isFeatured,
      isSponsored: places.isSponsored,
      petFriendly: places.petFriendly,
      familyFriendly: places.familyFriendly,
      richnessScore: places.richnessScore,
      confidenceScore: places.confidenceScore,
      openingHours: places.openingHours,
      primaryImageUrl: places.primaryImageUrl,
      updatedAt: places.updatedAt,
    })
    .from(places)
    .where(
      and(
        eq(places.isPublished, true),
        isNotNull(places.latitude),
        isNotNull(places.longitude),
        gte(places.latitude, bbox.south),
        lte(places.latitude, bbox.north),
        gte(places.longitude, bbox.west),
        lte(places.longitude, bbox.east),
      ),
    )
    .limit(500);

  // Fetch category slugs for mapping
  const categories = await db
    .select({ id: placeCategories.id, slug: placeCategories.slug, name: placeCategories.name })
    .from(placeCategories)
    .where(eq(placeCategories.isActive, true));

  const categoryMap = new Map(categories.map((c) => [c.id, { slug: c.slug, name: c.name }]));

  // Convert to CandidatePlace and filter by corridor distance
  let candidates: CandidatePlace[] = rawPlaces
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => {
      const cat = p.categoryId ? categoryMap.get(p.categoryId) : null;
      const distFromRoute = distanceToRouteLine(
        p.latitude!,
        p.longitude!,
        origin.lat,
        origin.lng,
        destination.lat,
        destination.lng,
      );

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        shortDescription: p.shortDescription,
        latitude: p.latitude!,
        longitude: p.longitude!,
        state: p.state,
        categorySlug: cat?.slug ?? 'desconocido',
        categoryName: cat?.name ?? 'Desconocido',
        badges: p.badges as string[] | null,
        budgetLevel: p.budgetLevel,
        isFeatured: p.isFeatured,
        isSponsored: p.isSponsored,
        petFriendly: p.petFriendly,
        familyFriendly: p.familyFriendly,
        richnessScore: p.richnessScore ?? 0,
        confidenceScore: p.confidenceScore ?? 0,
        openingHours: p.openingHours,
        primaryImageUrl: p.primaryImageUrl,
        updatedAt: p.updatedAt,
        distanceFromRoute: distFromRoute,
      };
    })
    .filter((p) => p.distanceFromRoute <= CORRIDOR_BUFFER_KM);

  // Filter by budget compatibility
  const allowedBudgets = BUDGET_COMPATIBILITY[input.budget] ?? BUDGET_COMPATIBILITY.moderado;
  candidates = candidates.filter(
    (p) => !p.budgetLevel || allowedBudgets.includes(p.budgetLevel),
  );

  // Filter by family/pet friendly if needed
  if (input.travelers.hasChildren) {
    candidates = candidates.filter((p) => p.familyFriendly !== false);
  }
  if (input.travelers.hasPets) {
    candidates = candidates.filter((p) => p.petFriendly !== false);
  }

  // Filter by categories matching interests (keep places that match any interest, plus general stops)
  const generalCategories = ['gasolineras', 'casetas', 'paradas-utiles', 'talleres-auxilio'];
  if (input.interests.length > 0) {
    const interestSet = new Set([...input.interests, ...generalCategories]);
    candidates = candidates.filter((p) => interestSet.has(p.categorySlug));
  }

  // Score all candidates
  candidates = candidates.map((p) => ({
    ...p,
    score: scorePlace(p, input),
  }));

  // Sort by score descending and take top N
  candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return ensureNoDuplicates(candidates.slice(0, MAX_CANDIDATES));
}

// ── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Calculates a composite relevance score for a place.
 * - preference_match: 0-30 points based on category/interest alignment
 * - quality_score: 0-25 points based on badges, richness, official status
 * - popularity_score: 0-15 points based on reviews, is_featured
 * - detour_penalty: -20 to 0 points based on distance from route
 * - stale_penalty: -10 to 0 based on data freshness
 */
export function scorePlace(place: CandidatePlace, input: AutopilotInput): number {
  let score = 0;

  // 1. Preference match (0-30)
  const preferenceScore = calculatePreferenceMatch(place, input);
  score += preferenceScore;

  // 2. Quality score (0-25)
  const qualityScore = calculateQualityScore(place);
  score += qualityScore;

  // 3. Popularity score (0-15)
  const popularityScore = calculatePopularityScore(place);
  score += popularityScore;

  // 4. Detour penalty (-20 to 0)
  const detourPenalty = calculateDetourPenalty(place);
  score += detourPenalty;

  // 5. Stale penalty (-10 to 0)
  const stalePenalty = calculateStalePenalty(place);
  score += stalePenalty;

  return Math.max(0, Math.round(score * 100) / 100);
}

function calculatePreferenceMatch(place: CandidatePlace, input: AutopilotInput): number {
  let score = 0;

  // Direct interest match: +15
  if (input.interests.includes(place.categorySlug)) {
    score += 15;
  }

  // Style boost: +10 if category matches the chosen style
  const styleCategories = STYLE_CATEGORY_BOOSTS[input.style] ?? [];
  if (styleCategories.includes(place.categorySlug)) {
    score += 10;
  }

  // Must-visit proximity: +5 if place is near a must-visit spot
  for (const mv of input.mustVisit) {
    const dist = haversineDistance(place.latitude, place.longitude, mv.lat, mv.lng);
    if (dist < 10) {
      score += 5;
      break;
    }
  }

  return Math.min(30, score);
}

function calculateQualityScore(place: CandidatePlace): number {
  let score = 0;

  // Richness score (0-100 in DB, map to 0-10)
  score += Math.min(10, (place.richnessScore / 100) * 10);

  // Confidence score (0-100 in DB, map to 0-5)
  score += Math.min(5, (place.confidenceScore / 100) * 5);

  // Badges bonus
  const badgeCount = place.badges?.length ?? 0;
  score += Math.min(5, badgeCount * 1.5);

  // Has description: +2
  if (place.shortDescription) {
    score += 2;
  }

  // Has image: +3
  if (place.primaryImageUrl) {
    score += 3;
  }

  return Math.min(25, score);
}

function calculatePopularityScore(place: CandidatePlace): number {
  let score = 0;

  // Featured: +8
  if (place.isFeatured) {
    score += 8;
  }

  // Sponsored: +4 (business relevance)
  if (place.isSponsored) {
    score += 4;
  }

  // Pueblo Magico designation: +3
  if (place.categorySlug === 'pueblos-magicos') {
    score += 3;
  }

  return Math.min(15, score);
}

function calculateDetourPenalty(place: CandidatePlace): number {
  const distKm = place.distanceFromRoute ?? 0;

  if (distKm <= 5) return 0;
  if (distKm <= 15) return -3;
  if (distKm <= 30) return -8;
  if (distKm <= 50) return -14;
  return -20;
}

function calculateStalePenalty(place: CandidatePlace): number {
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - place.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate <= STALE_THRESHOLD_DAYS) return 0;
  if (daysSinceUpdate <= 365) return -3;
  if (daysSinceUpdate <= 730) return -6;
  return -10;
}

// ── Filtering helpers ───────────────────────────────────────────────────────

/**
 * Filters places that are known to be closed on the given dates.
 * Only filters if the place has structured opening hours data.
 */
export function filterByOpeningHours(
  candidates: CandidatePlace[],
  dates?: { start: string; end: string },
): CandidatePlace[] {
  if (!dates) return candidates;

  const startDate = new Date(dates.start);
  const endDate = new Date(dates.end);

  return candidates.filter((place) => {
    if (!place.openingHours || typeof place.openingHours !== 'object') {
      // No data available, assume open
      return true;
    }

    // Check if place has a "permanently_closed" flag
    const hours = place.openingHours as Record<string, unknown>;
    if (hours.permanentlyClosed === true) return false;

    // Check seasonal closures
    if (hours.seasonalClosure) {
      const closure = hours.seasonalClosure as { from: string; to: string };
      const closureStart = new Date(closure.from);
      const closureEnd = new Date(closure.to);

      // If trip dates overlap with closure, exclude
      if (startDate <= closureEnd && endDate >= closureStart) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Removes duplicate places by ID, keeping the first occurrence (highest score).
 */
export function ensureNoDuplicates(candidates: CandidatePlace[]): CandidatePlace[] {
  const seen = new Set<string>();
  return candidates.filter((place) => {
    if (seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
}

// ── Geometry helpers ────────────────────────────────────────────────────────

/**
 * Calculates a bounding box that covers the route corridor between two points,
 * with a buffer in km on each side.
 */
function calculateCorridorBoundingBox(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  bufferKm: number,
): { north: number; south: number; east: number; west: number } {
  // Degrees per km (approximate)
  const latDegPerKm = 1 / 111.32;
  const avgLat = (origin.lat + destination.lat) / 2;
  const lngDegPerKm = 1 / (111.32 * Math.cos((avgLat * Math.PI) / 180));

  const bufferLat = bufferKm * latDegPerKm;
  const bufferLng = bufferKm * lngDegPerKm;

  const minLat = Math.min(origin.lat, destination.lat);
  const maxLat = Math.max(origin.lat, destination.lat);
  const minLng = Math.min(origin.lng, destination.lng);
  const maxLng = Math.max(origin.lng, destination.lng);

  return {
    south: minLat - bufferLat,
    north: maxLat + bufferLat,
    west: minLng - bufferLng,
    east: maxLng + bufferLng,
  };
}

/**
 * Calculates the perpendicular distance from a point to the great-circle
 * line between origin and destination. Uses a simplified cross-track
 * distance formula suitable for Mexico-scale distances.
 */
function distanceToRouteLine(
  pointLat: number,
  pointLng: number,
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): number {
  // Use vector projection to find the closest point on the line segment
  const dx = destLng - originLng;
  const dy = destLat - originLat;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    // Origin and destination are the same point
    return haversineDistance(pointLat, pointLng, originLat, originLng);
  }

  // Parameter t for projection onto the line segment [0, 1]
  let t = ((pointLng - originLng) * dx + (pointLat - originLat) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  // Closest point on the segment
  const closestLat = originLat + t * dy;
  const closestLng = originLng + t * dx;

  return haversineDistance(pointLat, pointLng, closestLat, closestLng);
}
