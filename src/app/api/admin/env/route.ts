import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { getEnvStatus } from "@/lib/env";

/**
 * Admin-only env health dashboard. Returns the state of every tracked
 * production variable (ok / missing / placeholder) WITHOUT revealing the
 * values themselves. Useful to quickly answer "did Stripe make it into
 * prod?" without SSH'ing into the server.
 *
 * Gated to `role === 'admin'` so only you see this.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = getEnvStatus();
  const missingRequired = report.filter(
    (r) => r.required && r.state !== "ok",
  );

  return NextResponse.json(
    {
      ok: missingRequired.length === 0,
      environment: process.env.NODE_ENV ?? "unknown",
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      report,
    },
    {
      headers: { "cache-control": "no-store" },
    },
  );
}
