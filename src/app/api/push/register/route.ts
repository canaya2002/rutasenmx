import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { db, pushTokens } from "@/db";
import { getSession } from "@/lib/auth/session";
import { isExpoPushToken } from "@/lib/push/send";
import { getClientIp, checkAuthRateLimit } from "@/lib/auth/rate-limit";

/**
 * POST /api/push/register
 *
 * Mobile client calls this right after it successfully obtains an Expo push
 * token. Upserts a row in `push_tokens` — idempotent on (userId, token).
 *
 * The token itself is globally unique (enforced by `push_tokens_token_idx`),
 * so if a device is re-assigned to a different user (rare — logout/login
 * on the same device), we reassign the row instead of duplicating it.
 */

const schema = z.object({
  token: z.string().min(10).max(255),
  platform: z.enum(["ios", "android"]),
  locale: z.string().max(20).optional(),
  appVersion: z.string().max(20).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkAuthRateLimit(`push-register:${ip}`, 60, 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit", retryAfter: rl.retryAfterSeconds },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      },
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (!isExpoPushToken(parsed.data.token)) {
    // Not an Expo token — reject so we never POST garbage to Expo.
    return NextResponse.json(
      { error: "Token de push inválido" },
      { status: 400 },
    );
  }

  try {
    const [existing] = await db
      .select({ id: pushTokens.id, userId: pushTokens.userId })
      .from(pushTokens)
      .where(eq(pushTokens.token, parsed.data.token))
      .limit(1);

    if (existing) {
      await db
        .update(pushTokens)
        .set({
          userId: session.userId,
          platform: parsed.data.platform,
          locale: parsed.data.locale ?? null,
          appVersion: parsed.data.appVersion ?? null,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(pushTokens.id, existing.id));
    } else {
      await db.insert(pushTokens).values({
        userId: session.userId,
        token: parsed.data.token,
        platform: parsed.data.platform,
        locale: parsed.data.locale ?? null,
        appVersion: parsed.data.appVersion ?? null,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/register] DB error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  try {
    await db
      .delete(pushTokens)
      .where(
        and(
          eq(pushTokens.token, token),
          eq(pushTokens.userId, session.userId),
        ),
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/register] DB error on delete", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
