import slugify from 'slugify';

import superSeedRaw from '../../data/seeds/pueblos-magicos-177.json';
import detailedSeedRaw from '../../data/seeds/pueblos-magicos.json';
// Optional enrichment file produced by `npx tsx scripts/geocode-pueblos-magicos.ts`.
// Committed when empty; populated with { [pueblo_id]: { lat, lng } }.
import geocodedCoordsRaw from '../../data/seeds/pueblos-magicos-coords.json';

type GeocodedCoords = Record<string, { lat: number; lng: number }>;
const geocodedCoords = geocodedCoordsRaw as GeocodedCoords;

// ── Types ───────────────────────────────────────────────────────────────────

export interface PuebloMagicoSeed {
  id: string;
  macroregion: string;
  estado: string;
  pueblo_magico: string;
  resumen_general: string;
  dato_curioso: string;
  atracciones_principales: string[];
}

interface DetailedSeedEntry {
  name: string;
  state: string;
  municipality?: string;
  latitude: number;
  longitude: number;
  description: string;
  yearDesignated?: number;
}

export type ExperienceType =
  | 'naturaleza'
  | 'cultura'
  | 'gastronomia'
  | 'espiritualidad'
  | 'playa'
  | 'arqueologia'
  | 'aventura'
  | 'artesania';

export interface PuebloMagico {
  id: string;
  slug: string;
  name: string;
  macroregion: string;
  estado: string;
  estadoSlug: string;
  resumen: string;
  datoCurioso: string;
  atracciones: string[];
  /** Experience tags derived from seed keywords. */
  experiences: ExperienceType[];
  /** Coordinates. `coordPrecision` says whether they're exact (matched to detailed seed)
   *  or approximated from state centroid with deterministic jitter. */
  lat: number;
  lng: number;
  coordPrecision: 'exact' | 'approximate';
  /** Long description from detailed seed (when available). */
  longDescription?: string;
  yearDesignated?: number;
}

// ── State metadata ──────────────────────────────────────────────────────────

/** State centroid coordinates used when no exact pueblo coord is available.
 *  Source: geographical center of each Mexican state. */
const STATE_CENTROIDS: Record<string, { lat: number; lng: number; slug: string }> = {
  Aguascalientes: { lat: 21.8853, lng: -102.2916, slug: 'aguascalientes' },
  'Baja California': { lat: 30.8406, lng: -115.2838, slug: 'baja-california' },
  'Baja California Sur': { lat: 26.0444, lng: -111.6661, slug: 'baja-california-sur' },
  Campeche: { lat: 18.8348, lng: -90.1234, slug: 'campeche' },
  Chiapas: { lat: 16.7569, lng: -93.1292, slug: 'chiapas' },
  Chihuahua: { lat: 28.6353, lng: -106.0889, slug: 'chihuahua' },
  'Ciudad de México': { lat: 19.4326, lng: -99.1332, slug: 'ciudad-de-mexico' },
  Coahuila: { lat: 27.0587, lng: -101.7068, slug: 'coahuila' },
  Colima: { lat: 19.2452, lng: -103.7241, slug: 'colima' },
  Durango: { lat: 24.0277, lng: -104.6532, slug: 'durango' },
  'Estado de México': { lat: 19.4969, lng: -99.7233, slug: 'estado-de-mexico' },
  Guanajuato: { lat: 21.019, lng: -101.2574, slug: 'guanajuato' },
  Guerrero: { lat: 17.4392, lng: -99.5451, slug: 'guerrero' },
  Hidalgo: { lat: 20.0911, lng: -98.7624, slug: 'hidalgo' },
  Jalisco: { lat: 20.6597, lng: -103.3496, slug: 'jalisco' },
  Michoacán: { lat: 19.5665, lng: -101.7068, slug: 'michoacan' },
  Morelos: { lat: 18.6813, lng: -99.1013, slug: 'morelos' },
  Nayarit: { lat: 21.7514, lng: -104.8455, slug: 'nayarit' },
  'Nuevo León': { lat: 25.5922, lng: -99.9962, slug: 'nuevo-leon' },
  Oaxaca: { lat: 17.0732, lng: -96.7266, slug: 'oaxaca' },
  Puebla: { lat: 19.0414, lng: -98.2063, slug: 'puebla' },
  Querétaro: { lat: 20.5888, lng: -100.3899, slug: 'queretaro' },
  'Quintana Roo': { lat: 19.1817, lng: -88.4791, slug: 'quintana-roo' },
  'San Luis Potosí': { lat: 22.1565, lng: -100.9855, slug: 'san-luis-potosi' },
  Sinaloa: { lat: 24.8091, lng: -107.394, slug: 'sinaloa' },
  Sonora: { lat: 29.0729, lng: -110.9559, slug: 'sonora' },
  Tabasco: { lat: 17.8409, lng: -92.6189, slug: 'tabasco' },
  Tamaulipas: { lat: 23.7369, lng: -99.1411, slug: 'tamaulipas' },
  Tlaxcala: { lat: 19.3139, lng: -98.2404, slug: 'tlaxcala' },
  Veracruz: { lat: 19.1738, lng: -96.1342, slug: 'veracruz' },
  Yucatán: { lat: 20.7099, lng: -89.0943, slug: 'yucatan' },
  Zacatecas: { lat: 22.7709, lng: -102.5832, slug: 'zacatecas' },
};

// ── Slug helper ─────────────────────────────────────────────────────────────

function makeSlug(name: string): string {
  return slugify(name, { lower: true, strict: true, locale: 'es' });
}

// ── Deterministic jitter for approximate coords ─────────────────────────────

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/** Spreads a pueblo around the state centroid in a deterministic ring pattern
 *  so multiple pueblos from the same state don't stack on top of each other. */
function jitterCoord(slug: string, centroid: { lat: number; lng: number }) {
  const h = hashCode(slug);
  const angle = ((h % 360) * Math.PI) / 180;
  const radius = 0.35 + (Math.abs(h >> 8) % 100) / 200; // 0.35 – 0.85 degrees
  return {
    lat: centroid.lat + Math.sin(angle) * radius,
    lng: centroid.lng + Math.cos(angle) * radius,
  };
}

// ── Experience tagging ──────────────────────────────────────────────────────

const EXPERIENCE_KEYWORDS: Record<ExperienceType, RegExp> = {
  naturaleza:
    /\b(cascada|bosque|sierra|laguna|r[íi]o|cenote|volc[áa]n|selva|valle|cerro|m[oó]ntaña|monte|presa|parque nacional|[áa]rea protegida|biodiversidad|naturaleza)\b/i,
  cultura:
    /\b(colonial|ex[- ]?convento|barroco|virreinal|novohispano|cultural|patrimonio|hist[óo]rico|centro hist[óo]rico|hacienda|templo|parroquia|bas[íi]lica|museo)\b/i,
  gastronomia:
    /\b(tequila|mezcal|chocolate|caf[eé]|gastron|culinari|comida|mercado|mole|barbacoa|pastes|guayaba|vino|vi[ñn]edo|cerveza|ron|plato|cocina|feria)\b/i,
  espiritualidad:
    /\b(santuario|peregrin|m[íi]stic|convento|espiritual|huichol|wix[áa]rika|sagrado|devoci[oó]n|religioso|ritual|temazcal)\b/i,
  playa: /\b(playa|costa|mar|bah[íi]a|malec[oó]n|pac[íi]fico|caribe|oc[eé]ano)\b/i,
  arqueologia:
    /\b(zona arqueol[oó]gica|pir[áa]mide|prehisp[aá]nic|ruinas|maya|azteca|olmec|zapoteca|tolteca|mixteca|totonaca|mesoamericano)\b/i,
  aventura:
    /\b(senderismo|parapente|kayak|rapel|espeleolog|aventura|tirolesa|barranca|ciclismo|escalada|buceo|snorkel|rafting|ca[ñn][oó]n)\b/i,
  artesania:
    /\b(artesan|alfarer|cer[áa]mica|textil|plata|cobre|deshilado|talavera|bordado|telar|barro|vidrio|tejido|joyer|lapidar)\b/i,
};

function classifyExperiences(seed: PuebloMagicoSeed): ExperienceType[] {
  const corpus = [
    seed.resumen_general,
    seed.dato_curioso,
    ...seed.atracciones_principales,
  ].join(' ');

  const tags: ExperienceType[] = [];
  for (const [tag, re] of Object.entries(EXPERIENCE_KEYWORDS) as Array<
    [ExperienceType, RegExp]
  >) {
    if (re.test(corpus)) tags.push(tag);
  }

  // Every Pueblo Mágico counts as "cultura" minimum (colonial heritage is the
  // defining trait of the program).
  if (!tags.includes('cultura')) tags.unshift('cultura');

  return tags;
}

// ── Build lookup from detailed seed by pueblo name ──────────────────────────

const detailedByNormalizedName = new Map<string, DetailedSeedEntry>();

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(de|la|las|el|los|del)\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

for (const entry of detailedSeedRaw as DetailedSeedEntry[]) {
  detailedByNormalizedName.set(normalize(entry.name), entry);
}

// ── Build the enriched list ─────────────────────────────────────────────────

const superSeed = (superSeedRaw as unknown as {
  pueblos_magicos: PuebloMagicoSeed[];
}).pueblos_magicos;

const ALL: PuebloMagico[] = superSeed.map((seed) => {
  const slug = makeSlug(seed.pueblo_magico);
  const normalized = normalize(seed.pueblo_magico);
  const detailed = detailedByNormalizedName.get(normalized);
  const centroid = STATE_CENTROIDS[seed.estado];

  let lat: number;
  let lng: number;
  let coordPrecision: 'exact' | 'approximate';

  const geocoded = geocodedCoords[seed.id];

  if (detailed) {
    lat = detailed.latitude;
    lng = detailed.longitude;
    coordPrecision = 'exact';
  } else if (geocoded) {
    lat = geocoded.lat;
    lng = geocoded.lng;
    coordPrecision = 'exact';
  } else if (centroid) {
    const j = jitterCoord(slug, centroid);
    lat = j.lat;
    lng = j.lng;
    coordPrecision = 'approximate';
  } else {
    lat = 23.6345;
    lng = -102.5528;
    coordPrecision = 'approximate';
  }

  return {
    id: seed.id,
    slug,
    name: seed.pueblo_magico,
    macroregion: seed.macroregion,
    estado: seed.estado,
    estadoSlug: centroid?.slug ?? makeSlug(seed.estado),
    resumen: seed.resumen_general,
    datoCurioso: seed.dato_curioso,
    atracciones: seed.atracciones_principales,
    experiences: classifyExperiences(seed),
    lat,
    lng,
    coordPrecision,
    longDescription: detailed?.description,
    yearDesignated: detailed?.yearDesignated,
  };
});

// ── Public API ──────────────────────────────────────────────────────────────

export function getAllPueblos(): PuebloMagico[] {
  return ALL;
}

export function getPuebloBySlug(slug: string): PuebloMagico | undefined {
  return ALL.find((p) => p.slug === slug);
}

export function getPueblosByEstadoSlug(estadoSlug: string): PuebloMagico[] {
  return ALL.filter((p) => p.estadoSlug === estadoSlug);
}

export function getPueblosByMacroregion(macroregion: string): PuebloMagico[] {
  return ALL.filter((p) => p.macroregion === macroregion);
}

export function getPueblosByExperience(tag: ExperienceType): PuebloMagico[] {
  return ALL.filter((p) => p.experiences.includes(tag));
}

/** Unique macroregions, sorted alphabetically. */
export function getMacroregions(): string[] {
  return Array.from(new Set(ALL.map((p) => p.macroregion))).sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
}

/** Unique estados with at least one pueblo mágico. */
export function getEstadosWithPueblos(): Array<{
  name: string;
  slug: string;
  count: number;
  macroregion: string;
}> {
  const map = new Map<string, { name: string; count: number; macroregion: string }>();
  for (const p of ALL) {
    const entry = map.get(p.estadoSlug);
    if (entry) {
      entry.count += 1;
    } else {
      map.set(p.estadoSlug, {
        name: p.estado,
        count: 1,
        macroregion: p.macroregion,
      });
    }
  }
  return Array.from(map.entries())
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count, macroregion: v.macroregion }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function getExperienceCounts(): Record<ExperienceType, number> {
  const counts: Record<ExperienceType, number> = {
    naturaleza: 0,
    cultura: 0,
    gastronomia: 0,
    espiritualidad: 0,
    playa: 0,
    arqueologia: 0,
    aventura: 0,
    artesania: 0,
  };
  for (const p of ALL) {
    for (const tag of p.experiences) counts[tag] += 1;
  }
  return counts;
}

export const EXPERIENCE_LABELS: Record<ExperienceType, string> = {
  naturaleza: 'Naturaleza',
  cultura: 'Cultura',
  gastronomia: 'Gastronomía',
  espiritualidad: 'Espiritualidad',
  playa: 'Playa',
  arqueologia: 'Arqueología',
  aventura: 'Aventura',
  artesania: 'Artesanía',
};

export const EXPERIENCE_EMOJIS: Record<ExperienceType, string> = {
  naturaleza: '🌲',
  cultura: '🏛️',
  gastronomia: '🌮',
  espiritualidad: '🕊️',
  playa: '🏖️',
  arqueologia: '🏺',
  aventura: '⛰️',
  artesania: '🧶',
};
