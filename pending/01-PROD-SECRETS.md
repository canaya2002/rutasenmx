# 01 — Secretos de producción

**Bloquea:** todo. Sin estos el `next start` arranca pero falla en la primera request real.

## Cómo se pega

En Vercel: `Project → Settings → Environment Variables → Production`.
En otro host: exportar al entorno del proceso.

El código trae una validación de arranque: cuando `VALIDATE_ENV_ON_BOOT=1` y `NODE_ENV=production`, el server imprime `[env] MISSING ...` en los logs la primera vez que se carga `src/lib/env.ts`. También hay un endpoint admin-only en `/api/admin/env` que devuelve el estado sin revelar valores.

## Variables **obligatorias** (el web no funciona sin ellas)

| Variable | Formato esperado | Notas |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | Neon, Supabase, Railway, RDS, etc. **Debe incluir PostGIS** — `CREATE EXTENSION postgis;` en la DB. |
| `AUTH_SECRET` | string aleatorio ≥ 64 chars | Genera con `openssl rand -base64 48`. **NO reuses `k8Fj2mNpR4tW...`** del `.env.local` dev. |
| `NEXT_PUBLIC_APP_URL` | `https://rutasenmx.com` | Sin trailing slash. |
| `STRIPE_SECRET_KEY` | `sk_live_...` | **Modo live**, no `sk_test_`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Idem, debe empezar con `pk_live_`. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Del webhook productivo (no `stripe listen`). |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_...` | Creados en Stripe dashboard live. |
| `STRIPE_PRICE_PRO_ANNUAL` | `price_...` | |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | `price_...` | |
| `STRIPE_PRICE_PREMIUM_ANNUAL` | `price_...` | |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Sin esto, Autopilot cae a heurística (pierde magia pero no se rompe). |

## Variables **muy recomendadas** (features degradan silenciosamente si faltan)

| Variable | Qué se rompe si falta |
|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Los mapas no renderizan tiles. |
| `MAPBOX_SECRET_TOKEN` | Wizard Autopilot cae a geocoding heurístico (Pátzcuaro "no encontrado", etc.). |
| `INEGI_TOKEN` | Distancias / peajes usan estimación en vez de datos reales. |
| `SMTP_HOST` + `SMTP_USER` + `SMTP_PASSWORD` + `EMAIL_FROM` | No se envían correos transaccionales (bienvenida, reset password). |
| `S3_ENDPOINT` + `S3_BUCKET` + `S3_ACCESS_KEY` + `S3_SECRET_KEY` | Upload de fotos del perfil social falla. |
| `REVENUECAT_WEBHOOK_SECRET` | Webhook de IAP móvil responde 500 (por diseño fail-closed). Sin esto, suscripciones de App Store / Play Store nunca se sincronizan a la DB. |

## Variables **opcionales**

| Variable | Qué activa |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4. |
| `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` | AdSense (review tarda semanas). |
| `GOOGLE_SITE_VERIFICATION` | Search Console. |
| `POSTHOG_API_KEY` + `POSTHOG_HOST` | Analytics dashboard externo (los eventos ya se guardan en Postgres aunque no esté). |
| `SIGHTENGINE_USER` + `SIGHTENGINE_SECRET` + `MEDIA_MODERATION_PROVIDER=sightengine` | Moderación NSFW automática. |
| `SENTRY_DSN` | Error reporting web. |
| `VALIDATE_ENV_ON_BOOT=1` | Log de env al arrancar. Recomendado en prod. |

## Variables que **NO** debes copiar del `.env.local` actual

Ahora mismo `.env.local` trae test keys en `sk_test_...` / `pk_test_...`. No pegues estas en prod, te van a dar confusión cuando los pagos no aparezcan en el dashboard correcto.

## Cómo validar que quedó bien

```bash
# Local: hacer dry-run de la validación
VALIDATE_ENV_ON_BOOT=1 NODE_ENV=production node -e "require('./src/lib/env').reportEnvStatus()"

# En producción, loggéate como admin y pega:
curl -H "Authorization: Bearer $JWT" https://rutasenmx.com/api/admin/env | jq
```

El endpoint devuelve `state: 'ok' | 'missing' | 'placeholder'` para cada variable. Cualquier `placeholder` significa que pegaste el valor de `.env.example` sin reemplazarlo. Fix it.
