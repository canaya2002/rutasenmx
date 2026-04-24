import './_env';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
  const rows = await sql`
    SELECT state, COUNT(*)::int AS n
    FROM places
    WHERE is_published = true
    GROUP BY state
    ORDER BY state
  `;
  for (const r of rows) console.log(`${r.state}\t${r.n}`);
  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
