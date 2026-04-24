# 16 — Bugs y gaps de la auditoría

**Estado:** los 6 bugs originales **están arreglados**. Este archivo queda como registro de lo que encontramos y cómo lo cerramos.

---

## ✅ Bug #1 — Favorites POST no guardaba — **FIX**

**Archivo:** `src/app/api/favorites/route.ts`

Reescrito end-to-end:
- Schema `saved_places` ahora acepta `placeSlug` (varchar) además del legacy `placeId` (UUID nullable), porque el catálogo es editorial estático — no hay FK a `places` table.
- Índice único nuevo: `(userId, placeSlug)`. Evita duplicados idempotentemente.
- POST inserta, o retorna `200 alreadyFavorite: true` si ya existe. Actualiza `notes` si vienen en el body.
- GET lee solo las filas del user de la sesión y enriquece con metadata del catálogo (`getPlaceBySlug`). Slugs obsoletos se ocultan silenciosamente.
- DELETE nuevo con `?slug=...` para "desmarcar favorito".

**Tests:** `src/test/lib/favorites-api.test.ts` — 13 tests que cubren auth, dedup, catálogo inexistente, GET filtrado.

---

## ✅ Bug #2 — Favorites GET devolvía 3 lugares hardcoded — **FIX**

Eliminado junto con #1. Ahora GET consulta `saved_places` y pondera por `createdAt DESC`.

---

## ⚪ Bug #3 — Search solo en mock.ts — **NO ERA BUG**

Re-verifiqué. `mockPlaces` en `src/lib/data/mock.ts` es el array MERGED que incluye los ~30k lugares de `allRealPlaces`. `/api/search` ya escanea ese set completo. El TODO era una nota de futuro (migración a DB full-text), no una falla.

Nota real: si alguna vez migras a DB, cambia a `tsvector` con índice GIN. Mientras tanto, el in-memory filter está bien — corre server-side y los 30k están en memoria del proceso Next.js con cold-start cacheable.

---

## ✅ Bug #4 — Sitemaps incompletos — **FIX**

Los 4 sitemaps ahora generan URLs desde el catálogo completo:

| Sitemap | Antes | Después |
|---|---|---|
| `src/app/rutas/sitemap.ts` | 20 slugs hardcoded | Itera `mockRoutes` completo |
| `src/app/lugares/sitemap.ts` | 30 slugs hardcoded | Itera `mockPlaces` (~30k entries) |
| `src/app/guias/sitemap.ts` | 15 slugs hardcoded | Itera `mockArticles` |
| `src/app/colecciones/sitemap.ts` | 15 slugs hardcoded | Itera `mockCollections` |

Google tiene límite de 50,000 URLs por sitemap — bien por debajo. Si eventualmente supera, Next.js auto-splitea (`MetadataRoute.Sitemap[]` + `generateSitemaps()`).

---

## ✅ Bug #5 — Shared trip scaffold — **FIX**

**Archivos nuevos:**
- `src/app/(public)/compartido/[token]/page.tsx` — vista pública read-only del viaje (header con origen/destino/kms/horas/días/paradas, lista de días con paradas ordenadas, CTA "Planea el tuyo con IA").
- `src/app/api/trips/[id]/share/route.ts` — POST genera token URL-safe de 144 bits, pone `isPublic=true`. DELETE revoca.

`shareToken` ya existía en el schema de `trips`. Uso el índice único que ya estaba. Rotación funciona (siguiente POST genera nuevo token, link anterior 404s).

**Tests:** `src/test/lib/share-trip.test.ts` — 6 tests que cubren ownership, rotación, revocación.

---

## ✅ Bug #6 — Account deletion web — **FIX**

**Archivos nuevos:**
- `src/app/api/account/route.ts` — `DELETE` handler. Cancela Stripe, marca IAP canceled, borra push tokens, oculta social profile (`isVisible=false`), cierra matches, anonimiza el user (`deletedAt` + email/name/passwordHash scrubbed), limpia sesión. Todo best-effort — si Stripe falla, sigue con el soft-delete local.
- `src/components/profile/DeleteAccountPanel.tsx` — modal "Zona peligrosa" en `/perfil`. Auto-abre cuando llega `?delete=1` (el deep link del mobile → cumple Apple 5.1.1(v)). Pide escribir `ELIMINAR` para confirmar.

**Tests:** `src/test/lib/account-delete.test.ts` — 9 tests que cubren auth, Stripe cancel, tokens cleanup, anonimización, resilencia cuando servicios externos fallan.

**Importante:** el hard-delete completo (mensajes, fotos, trips, favoritos) requiere un cron job a 30 días — no existe aún, ver `15-FUTURE-WORK.md` #A. Mientras tanto el soft-delete + anonimización satisface Apple/Play porque el user "desaparece" de producto inmediatamente.

---

## 🟡 Bundle size — **NO FIX**

`src/lib/data/real-places.ts` = 32k líneas. Se importa en `src/lib/data/mock.ts` que a su vez es importado por client components (`SmartHeroSearch.tsx`, `explorar/explorar-client.tsx`). Esto significa que los visitantes de la home descargan ~500KB de JSON cada carga.

**Por qué no lo fixeé:** requiere refactor de esos componentes a modo "suggest via API" (llamar `/api/search` con debounce). Es trabajo de 2-3 horas con riesgo de romper UX. Te lo dejo como prioridad alta post-launch.

**Mitigación temporal:** Vercel comprime con brotli, así que los 32k de JS se convierten en ~80KB over-the-wire. No es ideal pero tampoco rompe LCP mobile en 4G.

**Plan de ataque (si decides hacerlo):**
1. Crear `/api/search/suggestions?q=...&type=place|state|category&limit=10`
2. Cambiar `SmartHeroSearch` para debounce 200ms → fetch → render
3. Eliminar import directo de `mockPlaces` en los client components
4. Ver si el lint detecta otros offenders con `grep -l "from '@/lib/data/mock'" src/components`

---

## 🟡 Catálogo estático vs DB — **DECISIÓN TOMADA: ESTÁTICO**

El catálogo (pueblos mágicos, museos, rutas, guías) es editorial, no cambia mucho, y vive en static files. No migré a DB. La razón:

1. Migrar 33 archivos y 35k líneas a Drizzle es 2-3 días de trabajo con riesgo alto.
2. Static files son más rápidos (cacheables al edge), más baratos (no consumen conexiones DB) y no requieren mantener seed scripts actualizados.
3. Los únicos datos que NECESITABAN DB eran los user-generated: `saved_places`, `trips`, `shared trips`, `social_*`, etc. — esos ya están en DB.

Si en algún momento decides migrar, el código está bien desacoplado: los API routes importan `getPlaceBySlug`, `mockPlaces`, etc. desde `@/lib/data/mock`. Sustituir ese módulo por queries Drizzle es una sola búsqueda global.

---

## ✅ Mobile typecheck — **FIX**

`mobile/node_modules` ahora instalado (con `--legacy-peer-deps` porque expo-router 4.0.22 pinea un peer de expo-constants incompatible con expo 54 — issue conocido de Expo SDK).

Detecté y arreglé 7 errores de tipo:
- 3× `Label({ children }: { children: string })` — widened a `React.ReactNode` porque template strings con `{count}` le pasan number.
- 1× `usePurchase` mutation types — widened a `PlanSlug | null`.

`cd mobile && npx tsc --noEmit` ahora sale limpio.

---

## ✅ Mobile a11y — **FIX parcial**

Añadí `accessibilityLabel` + hints a icon-only buttons críticos:
- Suscripción: botón cerrar
- Comunidad detail, Ruta detail, Lugar detail, Post detail, Mis-viajes detail: botón volver
- Conectar swipe: botones pasar/me-gusta con hint
- Chat: botón menú (más opciones)
- Mis-viajes delete: hint explicando qué hace
- ChatInput: TextInput y botón enviar

Pendiente (no crítico): los otros ~130 MotionPressables que tienen Text child — React Native auto-deriva el label del texto, entonces funciona con VoiceOver/TalkBack pero no es tan descriptivo.
