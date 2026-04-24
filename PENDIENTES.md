# PENDIENTES — Rutas en MX

> **Estado del código: 100% listo para deploy.** 424 tests pasando, 0 errores de tipo, 0 errores de lint, build verde.
> Lo que sigue es 100% de tu lado. Cada sección trae comandos exactos y qué pegar dónde.
>
> **Orden de ejecución:** sigue los grupos en orden. Cada grupo desbloquea al siguiente.

---

## Resumen ejecutivo de costos y tiempos

| Qué | $ | Tiempo |
|---|---|---|
| Dominio `rutasenmx.com` | ~$12 USD/año | 5 min + 1-48 h DNS |
| Postgres Neon (free tier 3 GB) | $0 | 15 min |
| Stripe (KYC + live) | 0% fijo, 3.6% por transacción | 1-3 días hábiles |
| Email Resend (3k/mes free) | $0 | 30 min |
| Apple Developer Program | $99 USD/año | 1-2 días aprobación |
| Google Play Console | $25 USD único | 1-7 días verificación |
| RevenueCat (<$10k MTR) | $0 | 1-2 h |
| Assets diseñador (5 PNGs + 8 screenshots) | $100-500 USD | 3-5 días |
| Llenar 4 datos legales (ver §6) | **$0** | **10 min** |
| **Total mínimo** | **~$150 USD** | **~2-3 semanas reales** |

---

## GRUPO 1 — Antes del primer deploy (bloqueadores duros)

### 1.1 — Crear Postgres productivo

**Recomendación: Neon.** Free tier sirve para <1000 usuarios, PostGIS preinstalado, SSL por default.

1. Ir a https://neon.tech/signup
2. Crear proyecto: nombre **"rutasenmx-prod"**, región **AWS US East (Ohio)** (más cerca de Vercel US-East — latencia <50ms)
3. Dashboard → **Connection Details** → copiar "Connection string" (termina en `?sslmode=require`)
4. Abrir la **SQL console** de Neon y correr:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS postgis_topology;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```
5. Guardar el connection string — lo pegarás en Vercel como `DATABASE_URL` (ver §1.6).

**Alternativa:** Supabase, Railway, AWS RDS. Todas funcionan. El código es agnóstico.

### 1.2 — Generar AUTH_SECRET

Una sola vez, en tu terminal:
```bash
openssl rand -base64 48
```
Copia el output. Lo pegas en `AUTH_SECRET` (§1.6). **No reuses** el del `.env.local` de dev.

### 1.3 — Crear CRON_SECRET

Mismo patrón — diferente valor:
```bash
openssl rand -hex 32
```
Lo usarás en §1.6 (`CRON_SECRET`) y también en **Vercel → Settings → Environment Variables**. Vercel Cron lo manda automáticamente como `Authorization: Bearer <secret>` a `/api/cron/hard-delete-users`.

### 1.4 — Registrar dominio `rutasenmx.com`

1. Namecheap / Cloudflare Registrar / Google Domains — cualquiera sirve (~$12/año)
2. Comprar `rutasenmx.com`
3. Esperar 5-30 min a que aparezca en tu panel
4. **No configures DNS todavía** — Vercel te va a dar los records exactos en §1.7

### 1.5 — Crear proyecto Vercel

1. https://vercel.com/signup (usa GitHub login — más fácil)
2. **New Project** → Import el repo `roadtomexico`
3. Framework preset: **Next.js** (auto-detectado)
4. Build command: `npm run build` (default)
5. Output: `.next` (default)
6. Environment variables: **no las pegues todavía** — lo hacemos en §1.6
7. Click **Deploy** — el primer deploy va a fallar porque no hay DB; no pasa nada, ya tenemos el proyecto creado

### 1.6 — Pegar env vars en Vercel (obligatorias de este grupo)

Vercel Dashboard → tu proyecto → **Settings → Environment Variables** → Production.

| Variable | Valor |
|---|---|
| `DATABASE_URL` | (connection string de Neon del §1.1) |
| `AUTH_SECRET` | (lo que generó openssl en §1.2) |
| `AUTH_COOKIE_NAME` | `rutasmx_session` |
| `NEXT_PUBLIC_APP_URL` | `https://rutasenmx.com` |
| `NEXT_PUBLIC_APP_NAME` | `Rutas en MX` |
| `CRON_SECRET` | (lo que generó openssl en §1.3) |
| `VALIDATE_ENV_ON_BOOT` | `1` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (ya la tienes en `.env.local`) |

**Redeploy** (botón en el dashboard). Ahora el build debería pasar con errores solo de env opcionales.

### 1.7 — Conectar dominio a Vercel

1. Vercel → tu proyecto → **Settings → Domains** → **Add**
2. Pegar `rutasenmx.com` → Add
3. Vercel te muestra 1-2 DNS records (A y/o CNAME). Cópialos.
4. Ir al panel DNS de tu registrador (Namecheap, Cloudflare, etc.)
5. Crear los records:

| Tipo | Host | Valor | TTL |
|---|---|---|---|
| A | `@` | `76.76.21.21` (Vercel te da el exacto) | Auto |
| CNAME | `www` | `cname.vercel-dns.com` | Auto |

6. Esperar 5 min - 48 h a que propague. En Vercel eventualmente aparece ✅
7. Forzar HTTPS (default en Vercel)

### 1.8 — Migrar schema a la DB productiva

En tu máquina local, con el `DATABASE_URL` productivo temporalmente en tu shell:
```bash
# REEMPLAZA con tu URL real de Neon
export DATABASE_URL="postgresql://user:pass@prod-host.neon.tech/db?sslmode=require"

npm run db:push
# Crea las 39 tablas. Si pide confirmar, escribe "y"
```

### 1.9 — Seed de catálogo + planes + comunidades

```bash
# Mismo shell con DATABASE_URL productivo
npm run seed              # pueblos mágicos + zonas arqueológicas
npm run seed:plans        # free / pro / premium
npm run seed:communities  # 8 foros + 1 canal
```

Son idempotentes — correrlos dos veces no duplica.

### 1.10 — Crear tu user admin

Una vez que el sitio productivo esté arriba, entra al navegador:
1. Ir a `https://rutasenmx.com/registrarse`
2. Crear tu cuenta con tu email real + un password fuerte
3. En la consola SQL de Neon corre:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'TU_EMAIL@tudominio.com';
   ```
4. Cierra sesión y vuelve a entrar. Ahora puedes acceder a `/admin/*`.

### 1.11 — Validar que el stack base funciona

```bash
# Uptime probe
curl https://rutasenmx.com/api/health
# Esperado: { "ok": true, "db": "up", "dbLatencyMs": <200 }

# Env health (requiere admin)
# Primero loguéate en el navegador como admin, copia el cookie rutasmx_session
curl -H "Cookie: rutasmx_session=TU_JWT" https://rutasenmx.com/api/admin/env | jq
# Esperado: todas las required con state="ok"
```

---

## GRUPO 2 — Pagos (Stripe) + email

### 2.1 — Stripe producción

1. Ir a https://dashboard.stripe.com → toggle superior **Test mode OFF** (passa a live)
2. Completar **Verify your business** (KYC):
   - RFC empresa o persona física con actividad empresarial
   - Comprobante de domicilio
   - Identificación oficial
   - CLABE bancaria mexicana
   - Aprobación: **1-3 días hábiles**
3. Mientras esperas el KYC, puedes configurar productos:
   ```bash
   # En tu shell con STRIPE_SECRET_KEY (live) y DATABASE_URL productivo
   export STRIPE_SECRET_KEY="sk_live_..."   # lo copias del dashboard Stripe
   export NEXT_PUBLIC_APP_URL="https://rutasenmx.com"
   npm run setup:stripe
   # Imprime 4 price IDs — guárdalos
   ```

### 2.2 — Pegar credenciales Stripe en Vercel

| Variable | Valor |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_...` (del §2.1) |
| `STRIPE_PRICE_PRO_ANNUAL` | `price_...` |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | `price_...` |
| `STRIPE_PRICE_PREMIUM_ANNUAL` | `price_...` |

### 2.3 — Webhook productivo de Stripe

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://rutasenmx.com/api/stripe/webhook`
3. Events (selecciona exactamente estos 5):
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click Add
5. Copia el **Signing secret** (empieza con `whsec_`)
6. Pégalo en Vercel como `STRIPE_WEBHOOK_SECRET`
7. **Redeploy Vercel**

### 2.4 — Activar Payment Methods México

Stripe Dashboard → **Settings → Payment methods**:
- ✅ Cards (auto)
- ✅ OXXO
- ✅ SPEI (transferencia)
- Opcional: Apple Pay, Google Pay

### 2.5 — Activar Customer Portal

Stripe Dashboard → **Settings → Billing → Customer portal** → Activate with defaults:
- ✅ Allow customers to cancel subscriptions
- ✅ Allow customers to update payment method
- ✅ Allow customers to switch plans

### 2.6 — Email transaccional (Resend)

1. https://resend.com/signup (free: 3k emails/mes, 100/día)
2. Dashboard → **Domains → Add Domain → rutasenmx.com**
3. Resend te da 3 records DNS:
   - `TXT` SPF
   - `CNAME` DKIM
   - `MX` (para recibir)
4. Pegar los 3 en tu DNS (Namecheap/Cloudflare — mismo panel del §1.7)
5. En Resend: click **Verify** — tarda 5-30 min
6. Resend → **API Keys → Create** → permisos "Sending only"
7. Pegar en Vercel:

| Variable | Valor |
|---|---|
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `resend` |
| `SMTP_PASSWORD` | `re_...` (la API key) |
| `EMAIL_FROM` | `hola@rutasenmx.com` |

8. Test con `mail-tester.com` para verificar deliverability (target: ≥9/10)

---

## GRUPO 3 — Mapas + almacenamiento

### 3.1 — Mapbox (mapas + geocoding)

1. https://mapbox.com/signup (free tier generoso)
2. Account → **Access tokens**:
   - Copia el **default public token** (empieza con `pk.`)
   - Create new token con scope `geocoding:read`, nómbralo "rutasmx-server" (empieza con `sk.`)
3. Pegar en Vercel:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `pk.eyJ...` |
| `MAPBOX_SECRET_TOKEN` | `sk.eyJ...` |

### 3.2 — S3-compatible storage (Cloudflare R2)

Recomendación: **Cloudflare R2** — gratis hasta 10 GB + 1M requests/mes, compatible con S3 API.

1. https://dash.cloudflare.com/sign-up
2. R2 → **Create bucket** → nombre `rutasmx-assets`
3. R2 → **Manage R2 API Tokens → Create API token**:
   - Permisos: Object Read & Write
   - Specify bucket: `rutasmx-assets`
4. Copia Access Key ID + Secret Access Key
5. R2 → bucket → **Settings → Public access → Custom domain** → `assets.rutasenmx.com`
6. Pegar en Vercel:

| Variable | Valor |
|---|---|
| `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_BUCKET` | `rutasmx-assets` |
| `S3_ACCESS_KEY` | (del §3.2.4) |
| `S3_SECRET_KEY` | (del §3.2.4) |
| `S3_REGION` | `auto` |

### 3.3 — INEGI (opcional — distancias/peajes reales)

1. https://gaia.inegi.org.mx/sakbe_v3.1/genera_token.jsp
2. Llenar el formulario con datos de empresa/persona
3. Te mandan el token por email en 1-2 días
4. Pegar como `INEGI_TOKEN` en Vercel

Sin esto, distancias se calculan por haversine (aprox, funciona).

---

## GRUPO 4 — Mobile apps (stores)

### 4.1 — Cuenta Apple Developer ($99 USD/año)

1. https://developer.apple.com/programs/enroll
2. Individual o Organization (Organization necesita D-U-N-S number — trámite 1 semana con Dun & Bradstreet, gratis)
3. Pagar $99 USD
4. Aprobación: **1-2 días**
5. Una vez dentro, ir a App Store Connect → **Agreements, Tax, and Banking**:
   - Paid Apps Agreement → Sign
   - Tax forms W-8BEN (México): llenar con tu RFC
   - Cuenta bancaria para payouts

### 4.2 — Cuenta Google Play Console ($25 USD único)

1. https://play.google.com/console/signup
2. Pagar $25 USD (una sola vez, no anual)
3. Verificación de identidad: selfie + ID oficial
4. Aprobación: **1-7 días**
5. Google Payments Center: setup fiscal + bancario

### 4.3 — Crear la app en Apple App Store Connect

1. ASC → **My Apps → +** → New App
2. Platforms: iOS
3. Name: **Rutas en MX** (30 chars max)
4. Primary Language: Spanish (Mexico)
5. Bundle ID: `com.rutasenmx.app` — si no existe, créalo en https://developer.apple.com/account/resources/identifiers/list
6. SKU: `rutasenmx-ios-01`
7. Anota:
   - **ASC App ID** (10 dígitos) → `mobile/eas.json` → `submit.production.ios.ascAppId`
   - **Apple Team ID** (10 chars, ves en Membership) → `appleTeamId`
   - Tu Apple ID email → `appleId`

### 4.4 — Crear la app en Google Play Console

1. Play Console → **Create app**
2. Name: **Rutas en MX**
3. Default language: Spanish (Mexico)
4. App or game: App
5. Free or paid: Free

### 4.5 — RevenueCat (une IAP Apple + Google + entitlements)

1. https://app.revenuecat.com/signup → proyecto "Rutas en MX"
2. **Apps → Add app**:
   - iOS: bundle `com.rutasenmx.app`. Te pide **App-Specific Shared Secret**: sacarla de ASC → Users and Access → Integrations → In-App Purchase → Generate
   - Android: package `com.rutasenmx.app`. Te pide **service account JSON** de Google Cloud (misma que §4.9)
3. Crear productos IAP en ASC (4 auto-renewables):
   - `pro_monthly` — $99 MXN — 1 month — Subscription Group "Rutas en MX Premium" tier 1
   - `pro_annual` — $999 MXN — 1 year — tier 1
   - `premium_monthly` — $299 MXN — 1 month — tier 2
   - `premium_annual` — $2,999 MXN — 1 year — tier 2

   **IMPORTANTE:** los IDs deben ser **exactos** (el webhook de `/api/iap/sync` mapea por substring).
4. Crear los MISMOS 4 productos en Play Console → **Monetize → Subscriptions** con los mismos IDs.
5. RevenueCat → **Products → Import from stores** → trae los 4 automáticamente.
6. RevenueCat → **Entitlements**:
   - Create `pro` → attach `pro_monthly`, `pro_annual`
   - Create `premium` → attach `premium_monthly`, `premium_annual`
7. RevenueCat → **Offerings → default**: añade 2 packages (`$rc_monthly`, `$rc_annual`) con los productos de ambas plataformas mapeados.
8. RevenueCat → **API keys**: copia las PUBLIC keys:
   - iOS: `appl_...`
   - Android: `goog_...`
9. Generar webhook secret:
   ```bash
   openssl rand -hex 32
   ```
10. RevenueCat → **Integrations → Webhooks → Add webhook**:
    - URL: `https://rutasenmx.com/api/iap/sync`
    - Authorization header value: `Bearer <el secret del paso 9>`
    - Events: **all**
    - Click "Send test event" → tu Vercel logs deben mostrar `{ ok: true, test: true }`
11. Pegar en Vercel: `REVENUECAT_WEBHOOK_SECRET=<el secret>`
12. El secret de RevenueCat también lo pasas a EAS como secret (§4.7).

### 4.6 — Assets finales del mobile

**Actual: placeholders emerald/navy autogenerados.** Reemplázalos antes de submit o Apple rechaza.

Contratar diseñador (Fiverr ~$100-150, entrega 2-3 días) pidiendo:
- **Icon 1024×1024 PNG sin alpha** (Apple)
- **Adaptive icon 1024×1024 con alpha, logo dentro del 66% central** (Android)
- **Splash 1242×2436 con logo centrado, fondo navy #0A0F14**
- **Notification icon 96×96 silueta blanca con alpha transparente** (crítico para Android)
- **Favicon 48×48**

Plus para stores:
- **iOS screenshots:** 3-8 en 1290×2796 (iPhone 6.7") — capturas de Home / Autopilot / Viaje / Paywall / Conectar
- **Android screenshots:** 3-8 en 1080×1920 (mínimo)
- **Feature graphic Google Play:** 1024×500
- **Icon Google Play:** 512×512 con alpha (distinto al de Apple)

Reemplazar en `mobile/assets/`:
```bash
# Estos archivos ya existen como placeholders — reemplázalos con los reales:
mobile/assets/icon.png
mobile/assets/adaptive-icon.png
mobile/assets/splash.png
mobile/assets/notification-icon.png
mobile/assets/favicon.png
```

`git add mobile/assets/ && git commit -m "feat(mobile): final brand assets"`

### 4.7 — EAS Build setup

```bash
npm i -g eas-cli
cd mobile
eas login                          # con tu cuenta Expo (crear en expo.dev si no tienes)
eas init                           # crea projectId, reemplaza `TO_BE_CREATED_BY_EAS_INIT` en app.json

# Pegar secrets (las RevenueCat keys del §4.5, y opcional Sentry)
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "appl_..."
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "goog_..."
# Opcional:
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://...@sentry.io/..."
```

### 4.8 — Credenciales iOS

```bash
cd mobile
eas credentials -p ios
# Selecciona "Let Expo handle the process"
# Expo genera Distribution Certificate + Provisioning Profile automáticamente
# Requiere que estés inscrito al Apple Developer Program (§4.1)
```

### 4.9 — Credenciales Android + service account

```bash
cd mobile
eas credentials -p android
# Selecciona "Let Expo generate a new keystore"
# Expo crea el upload keystore. NO LO PIERDAS.
```

Descarga backup del keystore (guárdalo en 1Password / Bitwarden — si lo pierdes, Google Play no te deja actualizar nunca):
```bash
eas credentials -p android
# Selecciona "Download credentials"
```

Google Play service account (para que `eas submit` suba el AAB automáticamente):
1. Play Console → **Setup → API access → Choose a service account**
2. Google Cloud Console → IAM → el nuevo service account → **Keys → Add key → JSON**
3. Descargar como `mobile/google-service-account.json` (ya está en `.gitignore`)
4. Play Console → **Users & Permissions → Invite** el service account email → rol **Admin**

### 4.10 — Primer build preview (TestFlight iOS / Internal Android)

```bash
cd mobile
npm run build:preview
# Tarda 15-25 min. Expo te da:
#   - URL para descargar el IPA (iOS) / APK (Android)
#   - QR para instalar con Expo Go dev client
```

Para iOS interno, usa **TestFlight**:
1. ASC → tu app → **TestFlight → iOS → Builds** → verás el build
2. Internal Testing → Add tu email + el de reviewer@rutasenmx.com
3. Instala TestFlight en tu iPhone → login → aparece tu app para instalar

Para Android:
1. Play Console → tu app → **Testing → Internal testing → Create new release**
2. Upload el AAB (eas te dio el link)
3. Add tu email a "Testers"
4. Te mandan un link de Play Store con acceso interno

### 4.11 — Listado App Store Connect

ASC → tu app:

**App Information:**
- Privacy Policy URL: `https://rutasenmx.com/privacidad`
- Support URL: `https://rutasenmx.com/ayuda`
- Marketing URL: `https://rutasenmx.com`
- Primary Category: **Travel**
- Secondary: **Social Networking**

**Pricing and Availability:**
- Price: Free
- Availability: México (expand después a US/AR/CO)

**Version 1.0:**
- Description (copiar de `pending/09-APPLE-STORE.md` §4)
- Keywords: `méxico,viaje,road trip,rutas,pueblos mágicos,itinerario,IA,mapas`
- Support URL
- Screenshots: las 3-8 del §4.6 en 1290×2796
- Build: selecciona el build de §4.10
- App Review Information:
  - Sign-in required: YES
  - Demo account: `reviewer@rutasenmx.com` / `TestPass2026!` (créala con plan Premium ya activo en la DB)
  - Notes: "Go to Perfil → Ver planes → el botón Suscribirme para probar IAP sandbox."
- Age Rating: responder cuestionario honestamente → sale 12+ (por el chat)

### 4.12 — Listado Google Play Console

Play Console → tu app:

**Store listing:**
- Short description (80 chars): "Planea rutas por México con IA. Autopilot, pueblos mágicos, conecta con viajeros."
- Full description: mismo texto que App Store
- App icon: 512×512 del §4.6
- Feature graphic: 1024×500 del §4.6
- Phone screenshots: 2-8 del §4.6 en 1080×1920
- Category: Travel & Local
- Contact email: soporte@rutasenmx.com

**App content (todo obligatorio antes de submit):**
- Privacy Policy: `https://rutasenmx.com/privacidad`
- App access: "All functionality available behind login" + demo account
- Ads: declara según si activas AdSense
- Content rating: llena el cuestionario IARC → sale Teen
- Target audience: 13+
- Data safety: llena el formulario (tabla completa en `pending/10-GOOGLE-PLAY.md §4`)

### 4.13 — Submit final

```bash
cd mobile
npm run build:production
# Espera el build (~20 min)
npm run submit:ios           # necesita mobile/eas.json con ascAppId + appleTeamId + appleId
npm run submit:android       # necesita mobile/google-service-account.json
```

Apple review: 24-48 h. Google review: 4-24 h.

---

## GRUPO 5 — DNS avanzado (Universal Links + emails)

### 5.1 — Apple App Site Association (Universal Links iOS)

Reemplaza `TEAMID` con tu Apple Team ID real:

Crear `public/.well-known/apple-app-site-association` con:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.rutasenmx.app",
        "paths": [
          "/lugares/*",
          "/rutas/*",
          "/mis-viajes/*",
          "/comunidad/*",
          "/categoria/*",
          "/precios",
          "/suscripcion",
          "/planear"
        ]
      }
    ]
  }
}
```

**Servirlo con `Content-Type: application/json`** (no `text/html`). Next.js lo hace automáticamente si lo pones en `public/.well-known/`. Verifica con:
```bash
curl -I https://rutasenmx.com/.well-known/apple-app-site-association
# content-type: application/json
```

Apple cachea hasta 48h — test con https://branch.io/resources/aasa-validator/

### 5.2 — Android Asset Links

```bash
cd mobile
eas credentials -p android
# Copia el "SHA-256 fingerprint" del Upload keystore
```

Crear `public/.well-known/assetlinks.json`:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.rutasenmx.app",
      "sha256_cert_fingerprints": ["AA:BB:CC:..."]
    }
  }
]
```

Validar con:
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://rutasenmx.com&relation=delegate_permission/common.handle_all_urls
```

### 5.3 — DMARC (anti-spoofing de email)

Pegar en tu DNS:
| Tipo | Host | Valor |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@rutasenmx.com` |

Empieza con `p=none` (solo reporta). Después de 2 semanas de logs limpios, sube a `p=quarantine` y luego `p=reject`.

---

## GRUPO 6 — Compliance legal

### 6.1 — Términos y Aviso de Privacidad (10 minutos, CERO honorarios legales)

Los dos documentos legales ya están **redactados en código** con cumplimiento estricto:

- **Aviso de Privacidad Integral** (`/privacidad`) — cumple artículos 15 y 16 LFPDPPP + artículos 26 a 28 del Reglamento + Lineamientos DOF 17-enero-2013. Cubre además GDPR (UE) y CCPA/CPRA (California).
- **Términos y Condiciones** (`/terminos`) — cumple LFPC (Arts. 76 Bis y 76 Bis 1), Código de Comercio, App Store Review Guideline 3.1.2 (auto-renovación) y Google Play Developer Policy (pricing + UGC moderation §10.3).

**Lo único que te falta: llenar 4 datos en un archivo.**

Abre `src/lib/legal/entity.ts` y reemplaza los 4 placeholders:

```ts
export const LEGAL_ENTITY = {
  legalName: '[RAZÓN SOCIAL COMPLETA]',   // ← 1. Tu razón social (persona moral) o nombre completo (persona física)
  rfc: '[RFC]',                            // ← 2. Tu RFC con homoclave
  address: '[CALLE Y NÚMERO], [COLONIA], …', // ← 3. Domicilio fiscal (el de tu Constancia de Situación Fiscal)
  phone: '[TELÉFONO CON LADA]',            // ← 4. Teléfono con lada

  // Todo lo demás ya está correcto:
  tradeName: 'Rutas en MX',
  domain: 'rutasenmx.com',
  privacyEmail: 'privacidad@rutasenmx.com',
  legalEmail: 'legal@rutasenmx.com',
  supportEmail: 'soporte@rutasenmx.com',
  jurisdiction: 'Ciudad de México, México',
  lastUpdated: '2026-04-24',
  version: 'v3.0',
} as const;
```

**Si operas como Persona Física con Actividad Empresarial:**
- `legalName` = tu nombre completo tal como aparece en tu CSF
- `rfc` = tu RFC de persona física (13 caracteres)

**Si es Persona Moral (S.A. de C.V., S. de R.L., S.A.P.I., etc.):**
- `legalName` = razón social completa **incluyendo el tipo societario**
- `rfc` = tu RFC moral (12 caracteres)

Guarda. `git commit -m "legal: fill entity placeholders"`. Deploy. Listo.

### 6.2 — Crea los buzones de correo legales

Los documentos referencian 3 direcciones específicas — **deben existir y ser atendidas**:

- `privacidad@rutasenmx.com` — solicitudes ARCO, plazo de respuesta 20 días hábiles (Art. 32 LFPDPPP)
- `legal@rutasenmx.com` — avisos DMCA, asuntos legales generales
- `soporte@rutasenmx.com` — soporte, reembolsos, quejas PROFECO

Créalos en el mismo dominio desde tu proveedor de email (Resend, Google Workspace, etc.). Todos pueden apuntar a la misma bandeja al inicio — lo importante es que lleguen.

### 6.3 — Registra ante INAI (opcional pero recomendado)

Si llegas a 100,000+ titulares de datos activos, INAI recomienda (no es obligatorio para empresas de tu tamaño inicial) dar aviso al Registro Nacional de Empresas:

- https://home.inai.org.mx/?page_id=1510 → "Registro Nacional de Empresas de Datos Personales"
- Sin costo. 15 min.

Te da un folio público que aumenta credibilidad y facilita que las autoridades sepan a quién contactar si hay queja.

### 6.4 — Account deletion verificado

Apple 5.1.1(v) rechaza apps sin in-app account deletion. **El código ya lo implementa.** Valida end-to-end después del deploy:

1. Entra como usuario de prueba en el mobile
2. Perfil → Eliminar cuenta → abre web `rutasenmx.com/perfil?delete=1`
3. Web muestra modal "Zona peligrosa" → escribir `ELIMINAR` → Eliminar definitivamente
4. Debe responder "Cuenta eliminada" + redirect a home en 2.5s
5. Login con mismo email debe fallar ("no existe el usuario")
6. A los 30 días: el cron `/api/cron/hard-delete-users` debe haber purgado físicamente trips, mensajes, favorites, push tokens (puedes verificar con `SELECT count(*) FROM users WHERE deleted_at < NOW() - INTERVAL '30 days'`)

### 6.5 — Marca (opcional)

- IMPI (https://impi.gob.mx): verificar "Rutas en MX" disponible como marca
- Registrar marca: ~$3,000 MXN, trámite 4-6 meses
- Sirve para defender el nombre ante copias; no es requisito para operar

### 6.6 — Cuándo consultar abogado (escenarios donde SÍ conviene)

Los documentos escritos cubren el 90% del riesgo legal típico. Recomendable contratar revisión notarial/abogado si:

- **Levantas ronda de inversión** — VCs exigen due-diligence legal de T&Cs + Privacy
- **Tu volumen de usuarios EU supera los 5,000** — GDPR Art. 37 puede exigir DPO
- **Procesas datos sensibles** (no es tu caso hoy, pero si añades health, biometric, etc.)
- **Te demandan o INAI te abre expediente** — obvio, necesitas representación

En esos escenarios un abogado puede auditar lo ya escrito (1-2 horas billables, ~$3-5k MXN) en vez de redactar desde cero ($15-30k). Te sale 5× más barato partir de los documentos actuales.

---

## GRUPO 7 — Monitoreo

### 7.1 — Uptime monitor (obligatorio práctico)

**UptimeRobot** (free, 50 monitors):
1. https://uptimerobot.com/signUp
2. New Monitor:
   - Type: HTTPS
   - Friendly Name: `Rutas en MX API health`
   - URL: `https://rutasenmx.com/api/health`
   - Monitoring interval: 5 min
   - Keyword: `"ok":true`
3. Alert contacts: tu email + SMS (recomendado)
4. Segundo monitor:
   - URL: `https://rutasenmx.com`
   - Keyword: `Rutas en MX`

### 7.2 — Stripe webhook alerts

Stripe Dashboard → Developers → Webhooks → tu endpoint → **Enable email alerts** → tu email

### 7.3 — Sentry (opcional, gratis hasta 5k events/mes)

Web:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
# El wizard edita next.config.ts + crea sentry.*.config.ts
# Pega SENTRY_DSN en Vercel
```

Mobile:
```bash
cd mobile
npm install sentry-expo @sentry/react-native
# Añadir Sentry.init() en mobile/app/_layout.tsx
# EXPO_PUBLIC_SENTRY_DSN ya está cableado en eas.json
```

---

## GRUPO 8 — QA manual antes de marketing

**Ejecutar el checklist completo en `pending/13-MANUAL-QA-CHECKLIST.md`.**

Resumen del camino crítico (10 minutos para validar todo):

### Web
- [ ] Registrarse con email real → redirige a `/mis-viajes`
- [ ] Cerrar sesión → login → entra de nuevo
- [ ] `/planear` → Autopilot genera con badge verde "IA" (no "Heurística")
- [ ] Guardar viaje → aparece en `/mis-viajes`
- [ ] Export PDF como free → con marca de agua
- [ ] `/precios` → Suscribirme a Pro → checkout Stripe → pago OK
- [ ] `/perfil` → plan=Pro
- [ ] Export PDF otra vez → **sin** marca de agua
- [ ] `/mis-viajes/[id]` → botón **Compartir** → copia URL → abrir en incógnito → funciona
- [ ] `/perfil?delete=1` → modal auto-abre → escribir ELIMINAR → cuenta borrada

### Mobile (con preview build en device real)
- [ ] Login con mismo user → entitlements muestra Pro
- [ ] Heart en un lugar → persiste entre sesiones
- [ ] `/favoritos` en mobile muestra la lista
- [ ] Botón share en un viaje → abre share sheet nativo
- [ ] Deep link: mandar `https://rutasenmx.com/lugares/teotihuacan` por iMessage → tap abre **en la app**, no Safari
- [ ] Swipe en Conectar → match con segunda cuenta → push llega al otro device en 30s
- [ ] Perfil → Eliminar cuenta → web abre modal correctamente
- [ ] Modo avión ON → banner amber "Sin conexión" aparece

---

## GRUPO 9 — Post-launch (cuando ya tengas usuarios)

### 9.1 — Monitoreo de métricas

Ya tienes instrumentado todo — los eventos se guardan en `analytics_events`:
- `/admin/analytics` dashboard (solo admins)
- PostHog (opcional): pega `POSTHOG_API_KEY` en Vercel → eventos van a PostHog sin más código

### 9.2 — Google Search Console

1. https://search.google.com/search-console → Add property → `rutasenmx.com`
2. Verifica con TXT DNS record (Google te da el valor)
3. Pegar ese valor en Vercel como `GOOGLE_SITE_VERIFICATION`
4. Submit sitemaps:
   - `https://rutasenmx.com/sitemap.xml` (root)
   - `https://rutasenmx.com/lugares/sitemap.xml`
   - `https://rutasenmx.com/rutas/sitemap.xml`
   - `https://rutasenmx.com/guias/sitemap.xml`
   - `https://rutasenmx.com/colecciones/sitemap.xml`
   - `https://rutasenmx.com/estados/sitemap.xml`
   - `https://rutasenmx.com/museos/sitemap.xml`
   - `https://rutasenmx.com/zonas-arqueologicas/sitemap.xml`
   - `https://rutasenmx.com/pueblos-magicos/sitemap.xml`

### 9.3 — Opcionales que no bloquean

- Google Analytics 4 (`NEXT_PUBLIC_GA_MEASUREMENT_ID` en Vercel)
- Google AdSense (revisar ~semanas)
- Sightengine para moderación NSFW automática
- Content marketing: llenar `/guias/*` con artículos SEO

---

## Cuando algo sale mal

| Síntoma | Primer lugar donde mirar |
|---|---|
| "Database error" en producción | `curl https://rutasenmx.com/api/health` → revisar `dbLatencyMs` + logs Vercel |
| Pagos Stripe no actualizan plan | Stripe dashboard → Webhooks → tu endpoint → "Event details" — filtrar por 4xx/5xx |
| IAP compras no reflejan | RevenueCat dashboard → Events → buscar evento reciente → verificar que tu `/api/iap/sync` respondió 200 |
| Deep links abren Safari en vez de la app | AASA mal servido: `curl -I https://rutasenmx.com/.well-known/apple-app-site-association` verificar Content-Type |
| Push no llega | Expo dashboard → Notifications → ratio delivered/sent. <60% = tokens muertos (el código los purga automáticamente) |
| App crashea al abrir en TestFlight | `eas build:view <BUILD_ID>` → descargar logs |
| Vercel deploy falla | Logs de build en Vercel → mayoría de veces: env var faltante; mira el output de `/api/admin/env` una vez que deploye |

---

## Archivos de referencia en este repo

Los detalles largos viven en `pending/*.md`. Este archivo es el **índice operativo**. Si necesitas más profundidad:

- `pending/01-PROD-SECRETS.md` — todas las env vars con su propósito
- `pending/02-DATABASE.md` — Neon + PostGIS setup detallado
- `pending/04-STRIPE-PRODUCTION.md` — KYC, productos, webhook en profundidad
- `pending/07-EAS-SETUP.md` — EAS credentials + OTA updates
- `pending/08-REVENUECAT-IAP.md` — IAP step-by-step + sandbox testing
- `pending/09-APPLE-STORE.md` — ASC listing completo
- `pending/10-GOOGLE-PLAY.md` — Play Console data safety detallado
- `pending/13-MANUAL-QA-CHECKLIST.md` — QA manual exhaustivo
- `pending/16-KNOWN-BUGS-AND-GAPS.md` — bugs detectados y arreglados en auditoría

---

## Estado final del código (snapshot al 2026-04-24)

```
✅ 424 tests passing (web)
✅ tsc --noEmit clean (web + mobile)
✅ eslint . 0 errors
✅ next build compiled successfully
✅ Mobile screens pulidas con a11y + KeyboardAvoidingView
✅ Favorites CRUD end-to-end (web + mobile)
✅ Share trip end-to-end (web + mobile)
✅ Account deletion Apple 5.1.1(v) compliant (mobile link + web modal + hard-delete cron)
✅ Push notifications cableadas
✅ Deep links cableados (solo falta AASA + assetlinks en DNS)
✅ Anti-open-redirect en login/register next= param
✅ Env validator boot-check
```

**Lo único que queda es este documento.** Buena suerte.
