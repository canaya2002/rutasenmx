// ---------------------------------------------------------------------------
// Transformador del seed mexico_routes_seed_104.json al formato MockRoute
// Convierte 104 rutas del catálogo maestro en objetos consumibles por la UI
// sin tocar el dataset editorial original (mockRoutes) — se fusionan en
// src/lib/data/routes.ts
// ---------------------------------------------------------------------------

import seedData from '../../../data/seeds/mexico_routes_seed_104.json';
import { mockStates, type MockRoute, type MockRouteStop } from './mock';
import { getCityCoords } from './city-coords';

interface SeedRoute {
  id: number;
  slug: string;
  route_name: string;
  origin_hub: string;
  region_cluster: string;
  states: string[];
  stops_ordered: string[];
  pueblos_magicos: string[];
  museums: string[];
  archaeology: string[];
  nature: string[];
  distance_class: 'short' | 'medium' | 'long' | string;
  best_trip_length_days: string;
  best_for: string[];
  curation_status: string;
  road_data_status: string;
  official_source_hints: string[];
}

interface SeedFile {
  routes: SeedRoute[];
}

// ---------------------------------------------------------------------------
// Map estado "human readable" del seed -> slug del dataset de estados
// ---------------------------------------------------------------------------

const stateNameToSlug: Record<string, string> = {};
for (const s of mockStates) {
  stateNameToSlug[s.name] = s.slug;
  stateNameToSlug[s.name.toLowerCase()] = s.slug;
}
// Aliases explícitos por si hay diferencias menores
stateNameToSlug['CDMX'] = 'ciudad-de-mexico';
stateNameToSlug['Ciudad de México'] = 'ciudad-de-mexico';
stateNameToSlug['Edomex'] = 'estado-de-mexico';
stateNameToSlug['Estado de México'] = 'estado-de-mexico';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function distanceFromClass(cls: string, stops: number): number {
  // Estimaciones basadas en distance_class y número de paradas
  const perStop = 80; // km promedio entre paradas
  const base =
    cls === 'short' ? 120 :
    cls === 'medium' ? 260 :
    cls === 'long' ? 420 :
    300;
  return base + Math.max(0, stops - 2) * perStop;
}

function durationFromString(range: string): number {
  // "2-3" -> 3; "3-5" -> 5
  const m = range.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return parseInt(m[2], 10);
  const single = range.match(/(\d+)/);
  if (single) return parseInt(single[1], 10);
  return 3;
}

function drivingHoursFromDistance(distanceKm: number): number {
  // Velocidad promedio en carretera mexicana: ~85 km/h
  return Math.max(2, Math.round(distanceKm / 85));
}

function difficultyFromClass(cls: string): MockRoute['difficulty'] {
  if (cls === 'long') return 'moderada';
  if (cls === 'short') return 'facil';
  return 'facil';
}

function costFromDays(days: number): number {
  // MXN en centavos, como el resto de mockRoutes
  const perDay = 150000; // $1,500 MXN/día estimado
  return perDay * days;
}

function buildDescription(seed: SeedRoute): string {
  const bits: string[] = [];

  if (seed.pueblos_magicos.length > 0) {
    bits.push(`Pueblos Mágicos como ${seed.pueblos_magicos.slice(0, 3).join(', ')}`);
  }
  if (seed.archaeology.length > 0) {
    bits.push(`zonas arqueológicas (${seed.archaeology.slice(0, 2).join(', ')})`);
  }
  if (seed.museums.length > 0) {
    bits.push(`museos emblemáticos`);
  }
  if (seed.nature.length > 0) {
    bits.push(`paisajes naturales como ${seed.nature.slice(0, 2).join(', ')}`);
  }

  const highlights = bits.length > 0
    ? ` Incluye ${bits.join(', ')}.`
    : '';

  return `Ruta de carretera ${seed.route_name} cruzando ${seed.states.join(', ')}.${highlights} Ideal para ${seed.best_for.join(', ').replace(/_/g, ' ')} en un viaje de ${seed.best_trip_length_days} días.`;
}

function buildStops(seed: SeedRoute): MockRouteStop[] {
  return seed.stops_ordered.map((stopName, idx) => {
    const slug = toSlug(stopName);
    const coords = getCityCoords(slug) ?? getCityCoords(stopName);
    return {
      placeSlug: slug,
      placeName: stopName,
      order: idx + 1,
      stayMinutes: idx === 0 ? 0 : 240, // 4h promedio por parada
      note: buildStopNote(stopName, seed),
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
    };
  });
}

function buildStopNote(stopName: string, seed: SeedRoute): string {
  const isPM = seed.pueblos_magicos.includes(stopName);
  const nearMuseum = seed.museums.length > 0;
  const nearArch = seed.archaeology.length > 0;
  const nearNature = seed.nature.length > 0;

  if (isPM) return `Pueblo Mágico: camina el centro, prueba gastronomía local y dedica una tarde a recorrer sus alrededores.`;
  if (nearArch) return `Punto estratégico con acceso a zona arqueológica cercana y opciones culturales.`;
  if (nearMuseum) return `Parada con acceso a museos y patrimonio cultural del estado.`;
  if (nearNature) return `Base de operación para explorar paisajes naturales de la zona.`;
  return `Ciudad de paso con servicios básicos para viajeros de carretera.`;
}

function buildHighlights(seed: SeedRoute): string[] {
  const list: string[] = [];
  if (seed.pueblos_magicos.length > 0) {
    list.push(`${seed.pueblos_magicos.length} Pueblo${seed.pueblos_magicos.length > 1 ? 's' : ''} Mágico${seed.pueblos_magicos.length > 1 ? 's' : ''}: ${seed.pueblos_magicos.slice(0, 3).join(', ')}`);
  }
  if (seed.museums.length > 0) {
    list.push(`Museos: ${seed.museums.slice(0, 2).join(', ')}`);
  }
  if (seed.archaeology.length > 0) {
    list.push(`Arqueología: ${seed.archaeology.slice(0, 2).join(', ')}`);
  }
  if (seed.nature.length > 0) {
    list.push(`Naturaleza: ${seed.nature.slice(0, 2).join(', ')}`);
  }
  list.push(`Región ${seed.region_cluster}`);
  return list;
}

function seedToMockRoute(seed: SeedRoute): MockRoute {
  const days = durationFromString(seed.best_trip_length_days);
  const distance = distanceFromClass(seed.distance_class, seed.stops_ordered.length);
  const driving = drivingHoursFromDistance(distance);
  const stops = buildStops(seed);

  const statesSlugs = seed.states
    .map((st) => stateNameToSlug[st] ?? stateNameToSlug[st.toLowerCase()] ?? null)
    .filter((s): s is string => Boolean(s));

  return {
    id: `seed-${String(seed.id).padStart(3, '0')}`,
    slug: seed.slug,
    name: seed.route_name,
    description: buildDescription(seed),
    image: `/images/rutas/${seed.slug}.jpg`,
    origin: seed.stops_ordered[0] ?? seed.origin_hub,
    destination: seed.stops_ordered[seed.stops_ordered.length - 1] ?? seed.origin_hub,
    statesSlugs,
    distanceKm: distance,
    durationDays: days,
    drivingHours: driving,
    difficulty: difficultyFromClass(seed.distance_class),
    stops,
    highlights: buildHighlights(seed),
    estimatedCostMXN: costFromDays(days),
  };
}

const seedFile = seedData as SeedFile;

export const seedRoutes: MockRoute[] = seedFile.routes.map(seedToMockRoute);
