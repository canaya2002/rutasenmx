import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/db";

/**
 * Uptime / health probe.
 *
 * Returns 200 + `{ ok: true, db: "up", ... }` when we can reach the DB in
 * under ~800 ms. Otherwise returns 503 so monitoring (UptimeRobot, Better
 * Uptime, Pingdom, Vercel uptime, etc.) can fire an alert.
 *
 * No auth, no rate-limit, no caching headers — this endpoint is cheap by
 * design (one `SELECT 1`) and needs to be pingable anonymously.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startedAt = Date.now();
  let dbStatus: "up" | "down" = "down";
  let dbLatencyMs: number | null = null;

  try {
    const t0 = Date.now();
    // A trivial round-trip. Wrapped with a timeout so a stuck connection
    // doesn't make the probe hang forever.
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("db timeout")), 800),
      ),
    ]);
    dbLatencyMs = Date.now() - t0;
    dbStatus = "up";
  } catch {
    dbStatus = "down";
  }

  const ok = dbStatus === "up";
  const body = {
    ok,
    db: dbStatus,
    dbLatencyMs,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    environment: process.env.NODE_ENV ?? "unknown",
    elapsedMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: {
      "cache-control": "no-store, must-revalidate",
    },
  });
}
