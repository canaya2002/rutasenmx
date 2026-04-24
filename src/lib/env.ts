/**
 * Production env validation.
 *
 * Call `assertProductionEnv()` from any server entry point (or just log the
 * result via `reportEnvStatus()`). When `NODE_ENV === 'production'`, any
 * missing REQUIRED var logs a loud `[env]` error so it shows up in Vercel /
 * container logs on the first request, making the "why isn't X working in
 * prod?" question answerable with one grep.
 *
 * We deliberately DON'T throw — crashing the server on a missing optional
 * key would make the whole product unreachable for a fixable gap (e.g. a
 * missing STRIPE_WEBHOOK_SECRET shouldn't take the homepage down). Instead
 * we report clearly and let specific callers fail closed where it matters
 * (they already do — see `src/app/api/iap/sync/route.ts`).
 */

interface EnvSpec {
  key: string;
  required: boolean;
  purpose: string;
  /** Present but still considered missing if value matches one of these. */
  placeholderValues?: string[];
}

export const ENV_SPEC: EnvSpec[] = [
  // Core — without these the app does not work at all.
  {
    key: "DATABASE_URL",
    required: true,
    purpose: "Postgres connection — every DB query",
    placeholderValues: [
      "postgresql://rutasmx:rutasmx_dev@localhost:5432/rutasmx?sslmode=disable",
    ],
  },
  {
    key: "AUTH_SECRET",
    required: true,
    purpose: "JWT signing key for sessions",
    placeholderValues: ["generate-a-random-secret-here"],
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    required: true,
    purpose: "Canonical app URL (SEO, emails, Stripe redirects, mobile links)",
    placeholderValues: ["http://localhost:3000"],
  },

  // Payments — required for the paywall to work.
  {
    key: "STRIPE_SECRET_KEY",
    required: true,
    purpose: "Server-side Stripe API",
    placeholderValues: ["sk_test_your_stripe_key"],
  },
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    required: true,
    purpose: "Client-side Stripe.js",
    placeholderValues: ["pk_test_your_stripe_key"],
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    required: true,
    purpose: "Signing secret for /api/stripe/webhook",
    placeholderValues: ["whsec_your_webhook_secret"],
  },

  // IAP — required only if mobile is shipped. Flagged as optional here so
  // a web-only deploy still validates clean.
  {
    key: "REVENUECAT_WEBHOOK_SECRET",
    required: false,
    purpose: "Bearer token for /api/iap/sync (mobile IAP → DB)",
  },
  {
    key: "CRON_SECRET",
    required: false,
    purpose: "Bearer token Vercel Cron uses for /api/cron/* endpoints",
    placeholderValues: ["generate-a-random-secret-here"],
  },

  // Geocoding — without it, wizard falls back to heuristic suggestions.
  {
    key: "MAPBOX_SECRET_TOKEN",
    required: false,
    purpose: "Server-side geocoding in the Autopilot wizard",
    placeholderValues: ["your_mapbox_secret"],
  },
  {
    key: "NEXT_PUBLIC_MAPBOX_TOKEN",
    required: false,
    purpose: "Client-side map tiles",
    placeholderValues: ["your_mapbox_token"],
  },

  // AI.
  {
    key: "ANTHROPIC_API_KEY",
    required: false,
    purpose: "Autopilot IA (falls back to heuristic if missing)",
    placeholderValues: ["your_anthropic_key"],
  },

  // Email.
  {
    key: "SMTP_HOST",
    required: false,
    purpose: "Transactional email",
    placeholderValues: ["smtp.example.com"],
  },
  {
    key: "SMTP_USER",
    required: false,
    purpose: "SMTP auth user",
  },
  {
    key: "SMTP_PASSWORD",
    required: false,
    purpose: "SMTP auth password",
    placeholderValues: ["your_smtp_password"],
  },

  // Storage — required for social uploads.
  {
    key: "S3_ENDPOINT",
    required: false,
    purpose: "Object storage for social/profile uploads",
    placeholderValues: ["http://localhost:9000"],
  },
  {
    key: "S3_BUCKET",
    required: false,
    purpose: "S3 bucket name",
  },
  {
    key: "S3_ACCESS_KEY",
    required: false,
    purpose: "S3 access key",
    placeholderValues: ["minioadmin"],
  },
  {
    key: "S3_SECRET_KEY",
    required: false,
    purpose: "S3 secret key",
    placeholderValues: ["minioadmin"],
  },
];

export interface EnvStatus {
  key: string;
  purpose: string;
  required: boolean;
  state: "ok" | "missing" | "placeholder";
}

export function getEnvStatus(): EnvStatus[] {
  return ENV_SPEC.map((spec) => {
    const raw = process.env[spec.key];
    let state: EnvStatus["state"];
    if (!raw || raw.length === 0) {
      state = "missing";
    } else if (spec.placeholderValues?.includes(raw)) {
      state = "placeholder";
    } else {
      state = "ok";
    }
    return {
      key: spec.key,
      purpose: spec.purpose,
      required: spec.required,
      state,
    };
  });
}

export function reportEnvStatus(): { ok: boolean; report: EnvStatus[] } {
  const report = getEnvStatus();
  const badRequired = report.filter(
    (r) => r.required && r.state !== "ok",
  );
  const badOptional = report.filter(
    (r) => !r.required && r.state !== "ok",
  );

  if (process.env.NODE_ENV === "production" && badRequired.length > 0) {
    // Loud — one line per missing var so grep `[env] MISSING` works.
    for (const r of badRequired) {
      console.error(
        `[env] MISSING required: ${r.key} — ${r.purpose} (state=${r.state})`,
      );
    }
  }

  if (badOptional.length > 0 && process.env.NODE_ENV === "production") {
    for (const r of badOptional) {
      console.warn(
        `[env] optional skipped: ${r.key} — ${r.purpose} (state=${r.state})`,
      );
    }
  }

  return { ok: badRequired.length === 0, report };
}

/**
 * Run env validation on module load when the `VALIDATE_ENV_ON_BOOT` flag is
 * truthy. Vercel sets this for us on deploy by convention — set it manually
 * on other hosts to get the same behavior.
 */
export function maybeRunBootCheck() {
  if (
    process.env.VALIDATE_ENV_ON_BOOT === "1" ||
    process.env.VALIDATE_ENV_ON_BOOT === "true"
  ) {
    reportEnvStatus();
  }
}
