/**
 * Expo Push Notifications — thin server-side sender.
 *
 * No SDK dependency. We POST directly to the Expo Push API and handle the
 * two failure modes that actually matter:
 *   - `DeviceNotRegistered` → the user uninstalled the app or revoked
 *     permission. We delete the offending token so we stop trying.
 *   - anything else → log and move on. Notifications must never block the
 *     user-facing request that triggered them.
 *
 * Callers should invoke `sendPushToUser()` without awaiting — it's designed
 * to be fire-and-forget. The `emit(...)` analytics pattern, but for pushes.
 *
 * Reference: https://docs.expo.dev/push-notifications/sending-notifications/
 */
import { eq, inArray } from "drizzle-orm";

import { db, pushTokens } from "@/db";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  title: string;
  body: string;
  /** Route the app opens when the user taps the notification. */
  data?: Record<string, unknown>;
  /** Sound to play. Defaults to 'default'. Pass null for silent. */
  sound?: "default" | null;
  /** Category identifier for iOS actions. */
  categoryId?: string;
}

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoResponse {
  data?: ExpoTicket | ExpoTicket[];
  errors?: unknown[];
}

async function postToExpo(
  tokens: string[],
  message: PushMessage,
): Promise<ExpoTicket[]> {
  if (tokens.length === 0) return [];
  const payload = tokens.map((to) => ({
    to,
    title: message.title,
    body: message.body,
    data: message.data ?? {},
    sound: message.sound === null ? undefined : (message.sound ?? "default"),
    categoryId: message.categoryId,
    priority: "high" as const,
    _displayInForeground: true,
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "accept-encoding": "gzip, deflate",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      console.warn("[push] Expo returned", res.status);
      return [];
    }
    const json = (await res.json()) as ExpoResponse;
    const data = json.data;
    if (Array.isArray(data)) return data;
    if (data) return [data];
    return [];
  } catch (err) {
    console.warn("[push] Expo send failed", err);
    return [];
  }
}

/**
 * Send a push to every device the user has registered. Safe to fire-and-
 * forget: all errors are swallowed after logging.
 *
 * Removes tokens that Expo reports as unregistered so we don't keep retrying.
 */
export async function sendPushToUser(
  userId: string,
  message: PushMessage,
): Promise<void> {
  if (!userId) return;

  let rows: { token: string }[] = [];
  try {
    rows = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));
  } catch (err) {
    console.warn("[push] failed to load tokens for user", userId, err);
    return;
  }

  const tokens = rows.map((r) => r.token).filter(Boolean);
  if (tokens.length === 0) return;

  const tickets = await postToExpo(tokens, message);

  // Drop dead tokens so next time we don't waste a call on them.
  const deadTokens: string[] = [];
  tickets.forEach((ticket, i) => {
    if (ticket.status === "error") {
      const code = ticket.details?.error;
      if (code === "DeviceNotRegistered") deadTokens.push(tokens[i]!);
    }
  });

  if (deadTokens.length > 0) {
    try {
      await db.delete(pushTokens).where(inArray(pushTokens.token, deadTokens));
    } catch (err) {
      console.warn("[push] failed to prune dead tokens", err);
    }
  }
}

/**
 * Best-effort "this is an Expo token" check. We accept both
 * `ExponentPushToken[...]` and `ExpoPushToken[...]` formats — Expo's SDK has
 * used both variants over time.
 */
export function isExpoPushToken(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return (
    /^ExponentPushToken\[[^\]]+\]$/.test(value) ||
    /^ExpoPushToken\[[^\]]+\]$/.test(value)
  );
}
