/**
 * Enriches the 177 Pueblos Mágicos seed with accurate coordinates via
 * the Photon (OpenStreetMap) geocoder — no API key required.
 *
 * Usage:
 *   npx tsx scripts/geocode-pueblos-magicos.ts
 *
 * Writes: data/seeds/pueblos-magicos-coords.json
 *
 * The loader at src/lib/pueblos-magicos.ts will prefer these coords when
 * available, falling back to state-centroid jitter otherwise.
 */
import { writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

interface SuperSeed {
  pueblos_magicos: Array<{
    id: string;
    estado: string;
    pueblo_magico: string;
  }>;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    osm_value?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

const SEED_PATH = resolve('data/seeds/pueblos-magicos-177.json');
const OUTPUT_PATH = resolve('data/seeds/pueblos-magicos-coords.json');
const PHOTON_URL =
  process.env.PHOTON_URL ?? 'https://photon.komoot.io/api/';

const REQUEST_DELAY_MS = 1000; // Photon asks for <=1 req/s
const TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function pickBestFeature(
  features: PhotonFeature[],
  expectedState: string,
): PhotonFeature | null {
  if (features.length === 0) return null;

  const inMexico = features.filter(
    (f) =>
      f.properties.countrycode === 'MX' ||
      f.properties.country === 'México' ||
      f.properties.country === 'Mexico',
  );
  const pool = inMexico.length ? inMexico : features;

  const exactState = pool.find(
    (f) =>
      f.properties.state &&
      f.properties.state.toLowerCase().includes(expectedState.toLowerCase()),
  );
  return exactState ?? pool[0];
}

async function geocode(
  pueblo: string,
  estado: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(`${pueblo}, ${estado}, México`);
  const url = `${PHOTON_URL}?q=${q}&limit=5`;

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = (await res.json()) as PhotonResponse;
    const feat = pickBestFeature(data.features ?? [], estado);
    if (!feat) return null;
    const [lng, lat] = feat.geometry.coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    // Sanity check: must be within Mexico bbox.
    if (lat < 14 || lat > 33 || lng < -118 || lng > -86) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

async function main() {
  const raw = await readFile(SEED_PATH, 'utf8');
  const seed = JSON.parse(raw) as SuperSeed;

  let existing: Record<string, { lat: number; lng: number }> = {};
  try {
    existing = JSON.parse(await readFile(OUTPUT_PATH, 'utf8'));
  } catch {
    existing = {};
  }

  const out: Record<string, { lat: number; lng: number }> = { ...existing };

  let hits = 0;
  let misses = 0;
  let cached = 0;

  for (let i = 0; i < seed.pueblos_magicos.length; i++) {
    const p = seed.pueblos_magicos[i];
    if (out[p.id]) {
      cached += 1;
      continue;
    }

    const coord = await geocode(p.pueblo_magico, p.estado);
    if (coord) {
      out[p.id] = coord;
      hits += 1;
      console.log(
        `[${i + 1}/${seed.pueblos_magicos.length}] ✓ ${p.pueblo_magico} (${p.estado}) → ${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`,
      );
    } else {
      misses += 1;
      console.log(
        `[${i + 1}/${seed.pueblos_magicos.length}] ✗ ${p.pueblo_magico} (${p.estado})`,
      );
    }

    // Save after every successful hit so a crash doesn't lose work.
    if (hits % 10 === 0 && hits > 0) {
      await writeFile(OUTPUT_PATH, JSON.stringify(out, null, 2));
    }

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(out, null, 2));

  console.log('\nDone.');
  console.log(`  cached:  ${cached}`);
  console.log(`  hits:    ${hits}`);
  console.log(`  misses:  ${misses}`);
  console.log(`  written: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
