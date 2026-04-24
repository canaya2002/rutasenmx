# Plan: Rutas en MX → Mobile (Expo Go / iOS + Android)

> Documento vivo. Este es el **blueprint**. La implementación ocurre en una segunda pasada,
> una vez aprobado el plan. Todo pensado para: 0 errores visuales, seguridad al máximo,
> sin doble cobro cross-plataforma, glassmorphic moderno, UI/UX clara.

---

## 0. Principios (rigen todo lo demás)

1. **El web ya es la fuente de verdad de backend y dominio.** El mobile no duplica lógica: consume la misma API (`https://rutasenmx.com/api/*`) y comparte tipos via el paquete local `shared/`.
2. **Entitlements centralizados en el server.** El mobile jamás decide "este usuario es Pro" por su cuenta — siempre pregunta al API. Esto es lo que evita el doble cobro.
3. **Nada se envía al servidor sin validar primero en el cliente**, pero nada se acepta sin re-validar en el servidor. El mobile es hostil por defecto.
4. **Una base de código, dos targets**: iOS y Android corren sobre el mismo Expo project. No forks.
5. **0 regresión del web**: el mobile se agrega en `mobile/` como proyecto independiente dentro del mismo repo. El build de web ni se entera.

---

## 1. Arquitectura del monorepo

```
rutasmx/                    ← repo actual (ya existe)
├── src/                    ← web (Next.js) — NO se toca
├── mobile/                 ← NUEVO: Expo app
│   ├── app/                ← Expo Router (file-based routing, paralelo a Next)
│   ├── components/
│   ├── lib/
│   ├── app.json
│   ├── package.json        ← deps propias; NO mezcladas con las del web
│   └── eas.json            ← builds (EAS Build)
├── shared/                 ← NUEVO: código común web + mobile
│   ├── types/              ← re-exports desde src/lib/**/types.ts
│   ├── api/                ← cliente fetch tipado (ambos lo importan)
│   └── plans.ts            ← PLANS re-exportado (una sola fuente)
├── PLAN-MOBILE.md          ← este doc
└── PENDING-MANUAL.md
```

**Por qué `mobile/` y no un repo separado**: el dominio de negocio es idéntico; dos repos implicarían sincronizar cambios de schema/tipos manualmente. Un solo repo con directorios separados es más barato. Workspaces de npm resuelven los imports entre `mobile/` y `shared/`.

---

## 2. Stack técnico definitivo

| Capa | Elección | Por qué |
|---|---|---|
| Framework | **Expo SDK 54** (managed workflow) | Ships to store sin Xcode/Android Studio gymnastics; EAS Build en la nube. |
| Runtime | React Native 0.76+ con **New Architecture** (Fabric + TurboModules) | Performance real; transiciones smooth que exige el brief. |
| Navigation | **Expo Router v4** | File-based (análogo a Next App Router). Deep links gratis. |
| Styling | **NativeWind v4** (Tailwind en RN) | Paridad con el web, evita context-switch de nombres. |
| Animations | **Reanimated 3** + **Moti** | Glassmorphic + transiciones fluidas 60fps. |
| Blur | **expo-blur** | `BlurView` nativo (iOS nativo, Android RenderEffect). |
| Maps | **react-native-maps** con provider MapLibre/Mapbox | Soporta tiles custom; integra con backend `/api/geocode`. |
| State | **TanStack Query v5** | Cache, offline, retry, dedupe — mismo mental model que sirve en web. |
| Forms | **react-hook-form** + **Zod** | Mismo Zod del server (validación compartida). |
| Auth storage | **expo-secure-store** | JWT no en AsyncStorage. Keychain/Keystore hardware. |
| Biometría | **expo-local-authentication** | Face ID/Touch ID/huella. |
| Push | **expo-notifications** | Única fuente; Expo Push ruteado a APNs/FCM. |
| Analytics | **PostHog React Native** (con EVENTS del web) | Misma taxonomía que el web → funnels cross-platform. |
| Crash reporting | **Sentry Expo** | Source maps automatic con EAS. |
| Image picker | **expo-image-picker** + upload directo a `/api/social/upload` | Mismo pipeline media-safety del web. |
| IAP | **react-native-purchases** (RevenueCat) | Ver §4. Unifica entitlements Apple + Google + Stripe. |
| Deep links | `rutasenmx://` + App Links / Universal Links | Compartir viajes, abrir matches. |
| i18n | **i18n-js** + **expo-localization** | ES/EN desde perfil Expo. |
| Icons | **@expo/vector-icons** (Lucide set) | Mismo set visual del web. |

---

## 3. Rutas del mobile (Expo Router, `mobile/app/`)

Paralelo al web; cada ruta consume API del web:

```
mobile/app/
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot.tsx
├── (tabs)/
│   ├── _layout.tsx             ← bottom tabs (5)
│   ├── explorar.tsx            ← mapa + feed
│   ├── rutas.tsx               ← rutas curadas
│   ├── autopilot.tsx           ← wizard IA (con glass hero)
│   ├── conectar.tsx            ← swipe card stack (Tinder-style)
│   └── perfil.tsx
├── trip/[id].tsx
├── lugar/[slug].tsx
├── pueblo-magico/[slug].tsx
├── conectar/
│   ├── perfil.tsx              ← editar perfil social
│   ├── matches.tsx             ← lista
│   └── chat/[matchId].tsx
├── comunidad/
│   ├── index.tsx
│   ├── [slug].tsx              ← foro/grupo
│   ├── post/[postId].tsx
│   └── grupos/nuevo.tsx
├── suscripcion.tsx             ← ver §4
├── precios.tsx
├── +not-found.tsx
└── _layout.tsx                 ← root: SafeArea, Providers, SplashScreen, auth gate
```

---

## 4. 🛡 Pagos sin doble cobro (sección crítica)

**El problema real:**
- Apple/Google exigen **In-App Purchase (IAP)** para suscripciones digitales en móvil. No se puede usar Stripe dentro de la app (te rechazan el review) salvo para "servicios físicos".
- Si usas IAP en mobile y Stripe en web, un mismo usuario podría pagar **dos veces** si no hay fuente central de verdad.

**Arquitectura que resuelve esto:**

```
           ┌─────────────────┐
           │   RevenueCat    │  ← "source of truth" de entitlements
           │  (gratis < 10k  │
           │     $/mes)      │
           └────┬────────┬───┘
         ┌──────┘        └──────┐
         │                      │
    ┌────▼────┐            ┌────▼────┐
    │ Stripe  │            │  IAP    │
    │ (web)   │            │(iOS+And)│
    └────┬────┘            └────┬────┘
         │                      │
    ┌────▼──────────────────────▼────┐
    │  Nuestro backend               │
    │  GET /api/entitlements         │← lo único que el mobile consulta
    │  → { plan: 'pro', source:      │
    │     'stripe', expiresAt: ... } │
    └────────────────────────────────┘
```

**Flujo anti-doble cobro (spec literal):**

1. Usuario abre `/suscripcion` en mobile.
2. App llama `GET /api/entitlements` (nuevo endpoint).
3. Server devuelve:
   ```json
   {
     "plan": "pro",
     "activeSource": "stripe_web",      // stripe_web | apple_iap | google_iap | none
     "canUpgradeInApp": false,          // false si ya tiene una sub activa en otro lado
     "message": "Tu plan Pro está activo vía web. Administra tu suscripción en rutasenmx.com/suscripcion."
   }
   ```
4. El botón "Suscribirse" en mobile está **deshabilitado** con el mensaje de arriba si `canUpgradeInApp === false`.
5. Si `activeSource === 'none'`, mobile dispara RevenueCat.purchaseProduct → App Store/Google Play IAP.
6. Webhook de RevenueCat → nuestro `POST /api/entitlements/webhook` → upserta en tabla `mobile_subscriptions` con `source: 'apple_iap' | 'google_iap'` + `userId`.
7. La función `getCurrentPlanSlug(userId)` (ya existe) se extiende para leer de **stripe + mobile_subscriptions** y siempre devolver el plan activo más alto.

**Reglas server-side que programo:**

- Si el usuario intenta crear un Stripe Checkout y ya tiene un IAP activo: `POST /api/stripe/checkout` devuelve **409 Conflict** con `{ error: 'Ya tienes una suscripción activa en la app móvil' }`.
- Si se cancela el IAP (webhook `EXPIRATION` de RevenueCat): mantener `active` hasta `expiresAt`, luego degradar a free.
- Refunds de App Store (webhook `CANCELLATION` with refund): degradar inmediatamente + logueo de `subscription_refunded`.

**Nueva tabla DB (a agregar en pasada de implementación):**

```ts
export const mobileSubscriptions = pgTable("mobile_subscriptions", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
  source: varchar({ length: 20 }).notNull(), // 'apple_iap' | 'google_iap'
  revenueCatUserId: varchar({ length: 255 }).notNull(),
  productId: varchar({ length: 255 }).notNull(), // 'pro_monthly' etc.
  planSlug: varchar({ length: 50 }).notNull(),
  status: varchar({ length: 50 }).notNull(), // 'active' | 'expired' | 'canceled' | 'in_grace_period'
  currentPeriodStart: timestamp({ withTimezone: true }),
  currentPeriodEnd: timestamp({ withTimezone: true }),
  originalTransactionId: varchar({ length: 255 }),
  environment: varchar({ length: 20 }).notNull(), // 'sandbox' | 'production'
  ...timestamps,
});
```

**Productos IAP a crear en tiendas (tu lado, manual):**
- App Store Connect / Google Play Console:
  - `pro_monthly` ≈ $199 MXN = $11.99 USD tier
  - `pro_annual` ≈ $1,599 MXN = $99.99 USD tier
  - `premium_monthly` ≈ $349 MXN = $19.99 USD tier
  - `premium_annual` ≈ $2,799 MXN = $174.99 USD tier
- Apple/Google cobran **15-30%** — ya documentado en el plan financiero (no se pasa al usuario; es costo de adquisición).

---

## 5. Seguridad (no opcional)

| Vector | Mitigación |
|---|---|
| Token robo | JWT en **expo-secure-store** (Keychain iOS / Keystore Android). Nunca en AsyncStorage. |
| MITM en proxies HTTPS | `expo-web-browser` con certificate pinning custom para `/api/*` en build de producción. |
| Reverse engineering del bundle | Productos IAP validados server-side via RevenueCat webhooks (no confiar en receipts del cliente). |
| Biometría para compras | `LocalAuthentication.authenticateAsync()` obligatorio antes de confirmar compra. |
| Screen-capture de chats | `expo-screen-capture` → `preventScreenCaptureAsync()` en la pantalla de chat social (opt-in por el usuario). |
| Jailbreak / root | **expo-device** + `isRootedExperimentalAsync()` → bloquea si `production && rooted`. Configurable. |
| App vieja (client outdated) | Endpoint `/api/version-check` → devuelve `minVersion`. Si la app es menor → force-update modal no cerrable. |
| Offline token | Refresh tokens con rotación — caducidad 30d, refresh silencioso cada 24h. |
| Sesión múltiple | Tabla `device_sessions` — permite cerrar sesión remota desde el web. |
| Permisos abusados | Solo pedimos: Cámara (foto perfil/posts), Ubicación **foreground only** (nunca background sin opt-in explícito), Notificaciones. |
| Logs con PII | Sentry scrubbing + no logueamos bodies de mensajes chat ni emails. |

---

## 6. UI/UX (estilo antiguo + glassmorphic)

**Principios visuales:**
- Fondo oscuro `#0A0F14` con gradientes cálidos (terracotta / oaxaca-gold) en acentos.
- `BlurView` intensidad 60-80 en headers, tabbars, bottom sheets, modales → efecto glass sobre el mapa.
- Ring sutil `border-white/10` sobre cada superficie glass.
- Sombras grandes y suaves `shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)]` (mismo token del web).
- Tipografía: **Inter** para UI + **Fraunces** (display, "antiguo") en headings.
- Emoji de bandera 🇲🇽 es propiedad — úsalo en el empty-state y match.
- Iconografía monocromo con contexto de color sólo en estado activo.

**Componentes reutilizables (mobile/components/):**
- `<GlassCard blur="heavy" />` — BlurView + rounded-3xl + ring-1 white/10.
- `<MotionPressable>` — wraps Pressable con feedback háptico + scale 0.97 on press.
- `<ShimmerSkeleton>` — para loading states.
- `<SheetModal>` — bottom sheet con glass + snap points.
- `<ErrorBoundary>` — captura crashes por pantalla, no rompe toda la app.

**Transiciones limpias:**
- Navegación entre tabs: fade + scale (120ms).
- Push a detalle: slide-from-right (iOS default) / shared element en tarjetas de lugar.
- Match modal: spring scale 0.9 → 1.0 + confetti haptic.
- Swipe card: Reanimated, rotation interpolada con `interpolate(translationX, [-200, 0, 200], [-15deg, 0, 15deg])`.

**Estados sin bugs visuales (checklist):**
- [ ] Splash custom con logo (expo-splash-screen) — se esconde cuando el primer query carga, no antes.
- [ ] SafeAreaProvider global → ni notch ni home indicator rompen.
- [ ] KeyboardAvoidingView en cada form.
- [ ] FlashList (no FlatList) para listas de matches/posts — 10x más rápido.
- [ ] Images con blurhash placeholder mientras cargan (expo-image).
- [ ] Focus rings accesibles sin romper estética.
- [ ] Haptics en: match, upvote, like/pass, confirmar compra.

---

## 7. Tinder-style (swipe de viajeros) — especificación completa

**Pantalla `conectar.tsx`:**

- Stack de 3 tarjetas visibles (actual + 2 detrás, escalándose).
- Cada tarjeta: foto full-bleed con gradient overlay abajo, nombre, edad, destino, intent badge, 3 intereses visibles.
- Gesto: pan horizontal → rotación + opacity de badges LIKE/PASS.
- Threshold: `translationX > width * 0.35` para confirmar. Si no, spring-back.
- Botones inferiores: X (pass), ♥ (like), 🚩 (reportar).
- Después del 5º swipe: prefetch siguiente batch.
- Empty state: "No hay más por hoy — vuelve mañana o ajusta filtros" con CTA a filters.

**Filtros (bottom sheet glass):**
- Destino (picker de 32 estados).
- Intent (4 chips: convivir/salir/explorar/conocer).
- Rango de edad (slider doble 18-60).
- Intereses (multi-select, re-ordena resultados).

**Match:**
- Al hacer match, modal de celebración con:
  - Confetti (Reanimated + SVG).
  - Haptic success.
  - 2 CTAs: "Escribir mensaje" → chat, "Seguir descubriendo" → cierra.

**Chat:**
- WhatsApp-style bubble layout.
- Long-press en mensaje: menú (reportar, bloquear, cerrar conversación).
- Polling cada 3s (igual al web) — mobile puede migrar a WebSocket después si hace falta.
- Mensaje de sistema cuando la conversación se cierra.
- Typing indicator si el backend lo soporta (futuro; no bloqueante).

---

## 8. Notificaciones push (producto + retention)

**Eventos que disparan push:**
- `match_created` → "✨ Hiciste match con María"
- `message_sent` (si el receptor no está en la app) → "Luis: Voy a Oaxaca el sábado…"
- `trip_created` (otra persona compartió ruta pública) → si opt-in
- `subscription_renewal_upcoming` (7 días antes) → transparencia
- `autopilot_ready` → si el job tardó >30s y se finalizó con la app cerrada

**Stack:**
- `expo-notifications` en cliente.
- Token se guarda en tabla `push_tokens` (userId, platform, token).
- `/api/notifications/push` usa Expo Push API — un solo endpoint para iOS+Android.
- Rate-limited: máx 3 push/día por usuario, con "quiet hours" 22:00–08:00 en zona local.

---

## 9. Ofline-first (producto de viaje = sin señal en carretera)

- Todas las queries con TanStack Query tienen `staleTime: 5min` y `cacheTime: 24h`.
- `react-query-persist-client` → cache en AsyncStorage (NO secure, no es sensible).
- Viajes guardados: SQLite local con `expo-sqlite` como proyección read-only del server.
- Mapas: tiles cacheadas con `react-native-maps` offline regions (MapLibre tiene API nativa).
- Imágenes: `expo-image` con `cachePolicy: 'disk'`.
- Mensajes no enviados: cola en SQLite con retry exponencial. Indicador "⏳ pendiente" en UI.
- Banner "sin conexión" via `@react-native-community/netinfo`.

---

## 10. Roadmap de implementación (fases)

### Fase 0 — Scaffolding (½ día)
- `npx create-expo-app@latest mobile --template tabs`
- Workspaces de npm para `shared/` + `mobile/` + root (web).
- EAS init + `eas.json` con profiles: development, preview, production.
- Expo dev client configurado; Expo Go puede abrir el proyecto para iteración rápida pre-EAS.
- Sentry + PostHog wired.
- Commit: "mobile: scaffolding".

### Fase 1 — Auth + API client (1 día)
- `shared/api/client.ts` con fetch tipado + auto-refresh token.
- Login/Register/Forgot screens, glass inputs.
- SecureStore wrapper.
- Biometric unlock opt-in post-login.
- `/api/auth/me` → contexto de user global.

### Fase 2 — Lectura pública (1.5 días)
- Explorar (mapa + lista).
- Detalle de lugar.
- Rutas curadas.
- Pueblo mágico / zona arqueológica / museo.
- Todo read-only.

### Fase 3 — Trips + Autopilot (2 días)
- Mis viajes list.
- Detalle editable.
- Autopilot wizard 10 pasos con glass.
- Guardar viaje desde resultado.
- Export PDF (abre con `expo-sharing`).

### Fase 4 — Social / Tinder (2 días)
- Crear perfil social con foto real (expo-image-picker → `/api/social/upload`).
- Swipe stack con Reanimated.
- Filtros bottom sheet.
- Matches list + chat.
- Report/Block.
- Comunidades (foros/grupos/canales) + PostClient adaptado.

### Fase 5 — Entitlements + IAP (2 días)
- `/api/entitlements` nuevo endpoint server.
- Tabla `mobile_subscriptions` + migración.
- RevenueCat SDK integrado.
- Paywall con glass.
- Anti-doble-cobro: gate en suscripción screen.
- Sincronización via webhook RevenueCat.
- Pruebas en sandbox Apple/Google.

### Fase 6 — Push + Offline (1.5 días)
- Notificaciones de match/message/renovación.
- Cola offline de mensajes.
- Map tiles offline para viajes guardados.
- Banner sin conexión.

### Fase 7 — Polish + QA (2 días)
- Animations finas (spring configs).
- Empty states en cada pantalla.
- Error boundaries.
- Storybook opcional.
- Accessibility pass (VoiceOver + TalkBack).
- Dark/Light toggle (aunque default es dark glass).
- Localización ES/EN.
- Screenshots + app store listings.

**Total: ~12 días de ingeniería sólida.** Se puede paralelizar Fase 2+3 y Fase 4 si hay dos personas.

---

## 11. Cosas adicionales que yo agregaría (ideas de calidad / valor extra)

Más allá del brief, estas agregan defensibilidad real:

- **Widget iOS/Android**: "Próximo viaje" + "Tu match más reciente".
- **Share extension iOS**: compartir desde Safari → "Agregar a Rutas en MX" con el link del lugar.
- **Siri Shortcuts / App Intents**: "Hey Siri, próxima parada del viaje a Oaxaca".
- **CarPlay (iOS) / Android Auto**: mostrar la ruta del día en la pantalla del coche. Huge para el caso de uso real.
- **Scan QR del equipaje / código del hotel**: expo-barcode-scanner para guardar reservas.
- **Cálculo de CO₂ del trip**: pequeño call-out verde — rinde en copy.
- **Modo "viajamos en grupo"**: cuando 2+ matches coinciden destino, sugerir convertir a grupo de WhatsApp o crear grupo en `/comunidad` auto.
- **Retention de día-7 con nudge**: push el día 7 post-instalación si no ha hecho trip: "Cuéntanos a dónde te gustaría ir — el wizard tarda 30s."
- **Gamification mínimo**: badges por número de pueblos visitados (sello digital), compartibles en social. Esto resucita usuarios dormidos.
- **SOS mode / roadside assist (futuro feature flag ya presente)**: botón de emergencia con ubicación + contactos registrados + aseguradora.
- **Idioma pre-traducido para viajeros internacionales**: bilingüe por default en todas las rutas; detectar `Accept-Language` mobile.
- **Export a Google Maps / Apple Maps / Waze**: botón "Abrir ruta en…" con `Linking.openURL()` a deep links nativos.
- **Currency-convert automático en presupuestos**: detectar moneda del usuario y convertir desde MXN.

## 12. Métricas que el mobile debe reportar (desde el día 1)

Mismo `emit()` del web, via PostHog React Native:

| Evento | Cuándo | Propiedades clave |
|---|---|---|
| `app_open` | cold start | os, version, last_open_delta |
| `signup_completed_mobile` | post-register | platform |
| `trip_created_mobile` | guardar trip | plan |
| `autopilot_run_mobile` | generar | source (llm/heuristic) |
| `swipe_mobile` | swipe card | action |
| `match_created_mobile` | match | |
| `iap_started` | tap suscribirse | productId |
| `iap_completed` | IAP success | productId, priceLocal |
| `iap_failed` | IAP fail | reason |
| `iap_blocked_cross_platform` | paywall gated por web sub activo | existingSource |
| `push_permission_granted` | allow notifications | |
| `offline_mode_active` | detected no network >5s | |

Esto permite embudos cross-plataforma reales.

---

## 13. Checklist de lanzamiento mobile (antes de submit a stores)

- [ ] Icon + splash + adaptive icon (Android) + 1024px (iOS).
- [ ] Screenshots 6.7"/6.5"/5.5" (iOS) + phone/7" tablet (Android).
- [ ] App Store description + keywords + support URL + privacy URL.
- [ ] Privacy Nutrition Labels (iOS) + Data Safety form (Google).
- [ ] App Tracking Transparency prompt (iOS 14.5+) si usamos PostHog/tracking.
- [ ] TestFlight build aprobado + 10+ usuarios internos probando.
- [ ] Google Play internal testing + pre-launch report verde.
- [ ] IAP products approved (puede tardar 48h).
- [ ] Sandbox testers creados en App Store Connect + Google Play.
- [ ] Crash-free sesiones >99.5% en TestFlight antes de submit.
- [ ] OTA updates (EAS Update) configurados para hotfixes.

---

## Cierre

Este plan convierte al mobile en **un cliente más del mismo backend**, no en un producto separado. Mantiene la promesa "una fuente de verdad de pago" via RevenueCat como pegamento entre Stripe web + IAP mobile. Y el Tinder de viajeros aterriza nativo con swipe gesture real + Reanimated + haptics, no una web view disfrazada.

Cuando me digas "vamos", arranco con **Fase 0** (scaffolding). Cada fase la implemento completa, corro build en EAS preview, y confirmo antes de pasar a la siguiente.
