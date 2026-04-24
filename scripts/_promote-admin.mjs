import { readFileSync } from 'node:fs';
import postgres from 'postgres';

const url = readFileSync('.env.local', 'utf8')
  .split(/\r?\n/)
  .find((l) => l.startsWith('DATABASE_URL='))
  .slice('DATABASE_URL='.length);

const EMAIL = process.argv[2];
if (!EMAIL) {
  console.error('Usage: node scripts/_promote-admin.mjs <email>');
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });
const rows = await sql`UPDATE users SET role = 'admin' WHERE email = ${EMAIL} RETURNING id, email, role`;
if (rows.length === 0) {
  console.error('✗ No user found with email', EMAIL);
  console.error('  → Registra la cuenta primero en https://rutasenmx.com/registrarse');
} else {
  console.log('✓ Promoted to admin:', rows[0]);
}
await sql.end();
