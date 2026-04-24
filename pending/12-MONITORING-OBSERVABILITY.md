# 12 — Monitoreo y observabilidad

**No bloquea:** el app funciona sin esto. **Pero** lanzar sin ello significa que cuando algo falle en producción, vas a enterarte por Twitter antes que por tus logs.

## 1. Uptime monitor (recomendado — lo primero)

Endpoint listo: `GET https://rutasenmx.com/api/health` devuelve 200/503.

Opciones:
- **UptimeRobot** (free, 50 monitors): checks cada 5 min, alert email/Slack.
- **Better Uptime** ($20/mo): checks cada 30 seg, on-call escalation, status page pública.
- **Vercel Uptime** (incluido en Pro): solo para Vercel, fácil.

Setup mínimo:
- [ ] Monitor 1: `https://rutasenmx.com/api/health` — 200 expected — every 5 min
- [ ] Monitor 2: `https://rutasenmx.com` (homepage) — keyword "Rutas en MX" expected
- [ ] Alert: email + SMS (si vendes, te conviene SMS)

## 2. Error reporting (web)

Código listo para plugar:
- [ ] Cuenta gratis en Sentry (`sentry.io`) — 5k events/mes free
- [ ] Proyecto "rutasenmx-web" → copia DSN → `SENTRY_DSN` en Vercel
- [ ] `npm install @sentry/nextjs`
- [ ] `npx @sentry/wizard@latest -i nextjs` — crea `sentry.client.config.ts` y `sentry.server.config.ts` automáticamente
- [ ] Redeploy

El wizard agrega a `next.config.ts`:
```ts
import { withSentryConfig } from '@sentry/nextjs';
export default withSentryConfig(nextConfig, { ... });
```

## 3. Error reporting (mobile)

- [ ] `cd mobile && npm install sentry-expo @sentry/react-native`
- [ ] Crear proyecto "rutasenmx-mobile" en Sentry
- [ ] Añadir en `mobile/app/_layout.tsx`:
  ```tsx
  import * as Sentry from 'sentry-expo';
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enableInExpoDevelopment: false,
  });
  ```
- [ ] Secret ya cableado en `mobile/eas.json` → solo falta pegar valor en EAS secrets.
- [ ] `ErrorBoundary` (ya existe en `mobile/components/ErrorBoundary.tsx`) puede reportar a Sentry — tocar `componentDidCatch` con `Sentry.Native.captureException(error)`.

## 4. Product analytics

Ya tienes DOS sinks cableados en `src/lib/analytics.ts`:
- `dbSink` (siempre activo) — escribe a tabla `analytics_events`
- `posthogSink` (activa si `POSTHOG_API_KEY` está set)

### Mínimo indispensable (ver /admin/analytics)
- Eventos se guardan sin config extra
- `/admin/analytics` dashboard los grafica (solo admins)

### PostHog (recomendado)
- [ ] Free tier: 1M events/mes
- [ ] Setear `POSTHOG_API_KEY` y `POSTHOG_HOST` en Vercel
- [ ] Los eventos se envían automáticamente en paralelo a la DB
- [ ] Te da funnels, retention, dashboards visuales

### Google Analytics 4 (opcional)
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` → auto-inyectado en `src/app/layout.tsx` (si lo tienes cableado — verifica)

## 5. Vercel logs

- Default incluido. `Vercel Dashboard → Logs` muestra los últimos 1000 por hora.
- Para retención larga: **Axiom** ($25/mo) o **Logtail** (free tier) — integran directo.

## 6. Database monitoring

- **Neon** trae su propio dashboard (queries lentas, conexiones, almacenamiento)
- **pganalyze** ($99/mo) si tu DB crece y quieres optimization automática
- Hoy no necesitas nada extra.

## 7. Push delivery

- Expo dashboard → Notifications → ver ratio `delivered / sent`
- Si ratio < 60%: revisa que tus tokens no estén dead — el código ya prunea `DeviceNotRegistered`

## 8. SLA / status page (nivel avanzado)

Cuando tengas >1000 usuarios pagando:
- [ ] Status page (Instatus, Statuspage, o gratis con Better Uptime)
- [ ] Public SLA documentado
- [ ] Incident post-mortem templates

## 9. Alerta crítica: Stripe webhook fallando

El webhook de Stripe es SILENCIOSO cuando falla — si Stripe no puede alcanzar tu endpoint, se reintenta 3 veces y luego abandona. Setea:
- [ ] Stripe Dashboard → Developers → Webhooks → tu endpoint → **Enable email alerts**
- [ ] Incluye tu email personal + `tech@rutasenmx.com` si tienes team
