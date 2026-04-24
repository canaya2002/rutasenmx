# 08 — RevenueCat + IAP (Apple / Google)

**Bloquea:** suscripciones desde el app. Anti-double-billing también — sin esto, un usuario puede pagar dos veces.

## Código ya listo (mi lado)

- `src/app/api/iap/sync/route.ts` — webhook con validación Bearer + rate-limit + upsert idempotente.
- `src/db/schema.ts` → `mobile_subscriptions` table con índice único en `original_transaction_id`.
- `src/lib/subscription/current-plan.ts` → merge Stripe + IAP para `/api/entitlements`.
- `mobile/lib/iap.ts` → wrapper de `react-native-purchases`.
- `mobile/hooks/useIAP.ts` → bloquea compra si `canUpgradeInApp === false` (viene de Stripe web activo).
- `mobile/app/suscripcion.tsx` → paywall con banner anti-double-billing.
- **13 tests** en `src/test/lib/iap-webhook.test.ts`.

## Lo que te toca a ti

### 1. App Store Connect — productos IAP

- [ ] `appstoreconnect.apple.com` → My Apps → (tu app) → Subscriptions → **Create Subscription Group** "Rutas en MX Premium"
- [ ] Crear 4 productos auto-renewable:

| Product ID | Tier | Precio MXN | Duración |
|---|---|---|---|
| `pro_monthly` | 1 | $99 | 1 month |
| `pro_annual` | 1 | $999 | 1 year |
| `premium_monthly` | 2 | $299 | 1 month |
| `premium_annual` | 2 | $2,999 | 1 year |

Los product IDs **deben** ser exactamente estos — el webhook mapea `pro_*` → plan "pro" y `premium_*` → plan "premium" por matching de substring (ver `productIdToPlan` en `src/app/api/iap/sync/route.ts`).

- [ ] Para cada producto: añade **localization** en español y al menos inglés, descripciones, screenshots de review (1024×1024 de la pantalla de suscripción).
- [ ] Paid Apps Agreement firmado (Apple → Agreements, Tax, and Banking).

### 2. Google Play Console — productos IAP

- [ ] `play.google.com/console` → (tu app) → Monetize → Subscriptions → Create subscription
- [ ] Mismos 4 productos con los MISMOS IDs.
- [ ] Base plan: Auto-renewing, 1 month / 1 year. Precios coinciden con MXN.
- [ ] Licensing / tax setup en Google Payments Center.

### 3. RevenueCat setup

- [ ] `revenuecat.com/signup` → Create Project "Rutas en MX"
- [ ] Platforms:
  - **iOS** → bundle ID `com.rutasenmx.app` → subir App-Specific Shared Secret (ASC → Users and Access → Integrations → In-App Purchase)
  - **Android** → package `com.rutasenmx.app` → subir service account JSON de Google Cloud (mismo que Play Console submit)
- [ ] Products → Import from App Store Connect / Play Console. Te va a traer los 4.
- [ ] **Entitlements** — crea 2:
  - `pro` → attach `pro_monthly`, `pro_annual`
  - `premium` → attach `premium_monthly`, `premium_annual`
- [ ] **Offerings** → "default" → 2 packages:
  - `$rc_monthly` (o nombre custom) → asocia productos monthly de ambas plataformas
  - `$rc_annual` → asocia productos annual
- [ ] **API keys**:
  - iOS public SDK key (empieza con `appl_`)
  - Android public SDK key (empieza con `goog_`)
  - **Copia ambas** → `EXPO_PUBLIC_REVENUECAT_IOS_KEY` y `_ANDROID_KEY` en EAS secrets (ver `07-EAS-SETUP.md`)

### 4. Webhook RevenueCat → tu backend

- [ ] RevenueCat dashboard → Integrations → Webhooks → Add webhook
- [ ] URL: `https://rutasenmx.com/api/iap/sync`
- [ ] Authorization header: `Bearer <REVENUECAT_WEBHOOK_SECRET>` (genera uno con `openssl rand -hex 32` y pégalo también en Vercel env)
- [ ] Events: **all** (el código filtra internamente por los tipos que le importan)
- [ ] Click "Send test event" desde el dashboard → debería responder `{ ok: true, test: true }`. Verifica en tus logs de Vercel.

### 5. Sandbox testing (antes de submit real)

**iOS:**
- [ ] ASC → Users and Access → **Sandbox Testers** → crea 2 con emails que no sean tu Apple ID real
- [ ] En el device (no simulator), Settings → App Store → Sandbox Account → sign in con el tester
- [ ] Abre la app → /suscripcion → Suscribirme → debe mostrar el price sheet con "[Env: Sandbox]"
- [ ] Confirma → Revenue Cat debería loggear el evento → tu webhook debería recibir `INITIAL_PURCHASE`
- [ ] `/api/entitlements` debe devolver `plan: 'pro'` y `activeSource: 'apple_iap'`

**Android:**
- [ ] Play Console → Setup → License testing → añade el email de tu tester
- [ ] Internal testing track → sube el preview build (via `eas build --profile preview --platform android`)
- [ ] Download en el tester device, compra, verifica igual que iOS

### 6. Anti-double-billing end-to-end test

1. Compra Pro en Stripe web con test card.
2. Abre mobile con el mismo login.
3. `/suscripcion` debe mostrar banner amber "Gestiona en rutasenmx.com".
4. Tap en "Suscribirme" → Alert "Ya tienes una suscripción".
5. Al revés: cancela Stripe, compra Pro en iOS IAP.
6. Web `/precios` → botón de Pro deshabilitado con mensaje "Gestiona desde tu app móvil".

## Gotchas

- **Apple toma 15%** (small biz program) o 30% del primer año, 15% del año 2+. Planea márgenes.
- **Google toma 15%** en todos los casos (después del cambio en 2022).
- Sandbox "renueva" cada 5 minutos — útil para test pero confuso. No esperes días.
- `DeviceNotRegistered` en producción iOS = user rota iPhone / reinstala. Código ya trata ese caso (ver `src/lib/push/send.ts`).
- **NUNCA cambies un product ID después de crearlo.** Cambiar precio → OK. Cambiar nombre → OK. Cambiar ID → rompe todo.
