import { defineConfig } from "drizzle-kit";
import { readFileSync, existsSync } from "node:fs";

// drizzle-kit doesn't read .env.local on its own. Parse it ourselves (keeps
// us dotenv-free — same algorithm, ~10 lines).
function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const txt = readFileSync(path, "utf8");
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,

  // Ignore PostGIS system objects. Without this, drizzle-kit thinks the
  // PostGIS-owned tables/views (spatial_ref_sys, geography_columns,
  // geometry_columns) are "extra" tables and asks to DROP them — which would
  // break every geographic query in the app. PostGIS *must* remain
  // untouched; treat it as infrastructure, not schema.
  extensionsFilters: ["postgis"],

  // Belt-and-braces: also filter by table name in case the extension owner
  // detection fails on some Postgres versions.
  tablesFilter: ["!spatial_ref_sys", "!geography_columns", "!geometry_columns"],
});
