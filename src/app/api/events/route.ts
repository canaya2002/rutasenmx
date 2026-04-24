import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth/session';
import { emit, EVENTS, type EventName } from '@/lib/analytics';
import { checkAuthRateLimit, getClientIp } from '@/lib/auth/rate-limit';

const schema = z.object({
  name: z.string().min(1).max(120),
  properties: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().max(120).nullable().optional(),
  platform: z.enum(['web', 'mobile', 'ios', 'android']).optional(),
});

const ALLOWED_NAMES = new Set<string>(Object.values(EVENTS));

/**
 * POST /api/events
 *
 * Single ingress for analytics events from ANY client (web + mobile). Mirrors
 * server-side `emit()` semantics: fire-and-forget, fails soft, never blocks.
 *
 * Rules:
 *   - Rate-limited per IP (60/min) to prevent flooding.
 *   - Event name must be in the canonical EVENTS enum — unknown names 400.
 *   - Properties cap at 30 top-level keys and stringified ≤ 4KB (abuse guard).
 *   - User binding is optional: unauthenticated beacons still count towards
 *     funnel math, linked to sessionId.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkAuthRateLimit(`events:${ip}`, 60, 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit', retryAfter: rl.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { name, properties, sessionId, platform } = parsed.data;

  // Reject unknown event names — prevents random external callers from
  // polluting our taxonomy.
  if (!ALLOWED_NAMES.has(name)) {
    return NextResponse.json(
      { error: `Evento desconocido: ${name}` },
      { status: 400 },
    );
  }

  // Property size guard (abuse prevention)
  const props = properties ?? {};
  const keyCount = Object.keys(props).length;
  if (keyCount > 30) {
    return NextResponse.json(
      { error: 'Demasiadas properties (máx 30)' },
      { status: 400 },
    );
  }
  const approxSize = JSON.stringify(props).length;
  if (approxSize > 4096) {
    return NextResponse.json(
      { error: 'Properties demasiado grandes (máx 4KB)' },
      { status: 400 },
    );
  }

  const session = await getSession();

  emit(name as EventName, {
    userId: session?.userId ?? null,
    sessionId: sessionId ?? null,
    properties: { ...props, platform: platform ?? 'web' },
  });

  return NextResponse.json({ ok: true });
}
