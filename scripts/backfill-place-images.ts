/**
 * Backfills `places.primary_image_url` from the photo folders shipped in
 * `public/`. Groups places by state, then calls `uniqueSequence(state, n)` to
 * get n non-repeating images for that state — so two pueblos of the same
 * state never share the same cover (as long as the pool is large enough).
 *
 * Idempotent: re-running assigns the same image to the same place (the pick
 * is deterministic by state + slug order).
 *
 * Usage:
 *   npx tsx scripts/backfill-place-images.ts [--dry-run] [--force]
 */
import './_env';
import postgres from 'postgres';

import { uniqueSequence } from '../src/lib/data/place-images';

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });

  interface Row {
    id: string;
    slug: string;
    name: string;
    state: string | null;
    primary_image_url: string | null;
  }

  const rows = (await sql`
    SELECT id, slug, name, state, primary_image_url
    FROM places
    WHERE is_published = true
    ORDER BY state NULLS LAST, slug
  `) as unknown as Row[];

  console.log(`Fetched ${rows.length} published places`);

  const byState = new Map<string, Row[]>();
  for (const r of rows) {
    if (!FORCE && r.primary_image_url && r.primary_image_url.trim() !== '') {
      continue; // already has an image
    }
    const key = r.state ?? '__null__';
    if (!byState.has(key)) byState.set(key, []);
    byState.get(key)!.push(r);
  }

  let toUpdate: Array<{ id: string; url: string; state: string; slug: string }> = [];

  for (const [state, places] of byState) {
    const urls = uniqueSequence(state === '__null__' ? null : state, places.length);
    if (urls.length === 0) {
      console.warn(`  [skip] ${state}: no images available in pool`);
      continue;
    }
    console.log(`  ${state}: ${places.length} places ← ${urls.length} images`);
    for (let i = 0; i < places.length; i++) {
      toUpdate.push({
        id: places[i].id,
        url: urls[i],
        state,
        slug: places[i].slug,
      });
    }
  }

  console.log('');
  console.log(`Would update ${toUpdate.length} rows`);
  console.log('');
  console.log('Sample:');
  for (const u of toUpdate.slice(0, 6)) {
    console.log(`  ${u.state} :: ${u.slug}  →  ${u.url}`);
  }

  if (DRY_RUN) {
    console.log('');
    console.log('[DRY RUN] No writes performed. Re-run without --dry-run to apply.');
    await sql.end();
    return;
  }

  let written = 0;
  for (const u of toUpdate) {
    await sql`UPDATE places SET primary_image_url = ${u.url} WHERE id = ${u.id}`;
    written++;
  }

  console.log('');
  console.log(`Wrote ${written} rows.`);

  await sql.end();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
