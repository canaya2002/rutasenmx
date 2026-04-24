import './_env';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });

  const total = await sql`SELECT COUNT(*)::int AS n FROM places WHERE is_published = true`;
  const withImg = await sql`
    SELECT COUNT(*)::int AS n
    FROM places
    WHERE is_published = true
      AND primary_image_url IS NOT NULL
      AND primary_image_url <> ''
  `;
  const sample = await sql`
    SELECT slug, name, primary_image_url
    FROM places
    WHERE is_published = true
    ORDER BY is_featured DESC NULLS LAST, richness_score DESC NULLS LAST
    LIMIT 5
  `;

  console.log('Total published places:', total[0].n);
  console.log('With primary_image_url:', withImg[0].n);
  console.log('Sample:');
  for (const r of sample) {
    console.log(`  - ${r.name}: ${r.primary_image_url ?? '(null)'}`);
  }

  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
