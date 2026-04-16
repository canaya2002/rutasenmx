import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Lazy database connection.
 *
 * During `next build` and in edge/static contexts DATABASE_URL may not be
 * available.  We create the connection lazily on first use so builds never
 * crash.
 */
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Please add it to your .env.local file.",
    );
  }

  const poolSize = Number(process.env.POSTGRES_POOL_SIZE) || 1;

  const client = postgres(connectionString, {
    max: poolSize,
    prepare: process.env.POSTGRES_PREPARE !== "false",
  });

  return drizzle(client, { schema });
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    if (!_db) _db = createDb();
    return Reflect.get(_db, prop, receiver);
  },
});

// Re-export everything from schema for convenience
export * from "./schema";
export type Database = ReturnType<typeof drizzle<typeof schema>>;
