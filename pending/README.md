# Pendientes para Producción — Rutas en MX

> **Última actualización:** 2026-04-23 (Fase 7 completa del lado de código).
> Este índice está **ordenado por dependencia real de deploy**: lo que está arriba bloquea lo que está abajo. No es una wishlist — es un camino crítico.
>
> Lo único que he podido dejar listo yo es código + tests + docs. Todo lo que requiere una cuenta externa, DNS, un dashboard de terceros, llaves de API privadas, o acción humana (firmar cuentas legales, subir screenshots) vive aquí.

## Estado resumido

| Capa | Código listo | Infraestructura pendiente |
|---|---|---|
| Web (Next.js 16 + React 19) | ✅ Build verde, **390 tests**, 0 lint, 0 tsc errors | Vercel + Postgres prod + Stripe live + DNS |
| Mobile (Expo SDK 54) | ✅ `mobile/node_modules` instalado, `tsc --noEmit` clean | EAS init + stores + RevenueCat + assets finales |
| IAP (RevenueCat) | ✅ Webhook + anti-double-billing + paywall | Cuentas Apple/Google + productos IAP + RevenueCat |
| Push notifications | ✅ Servidor + cliente + handler tap | Compilado solo funciona en dev build o producción, NO Expo Go |
| Deep links | ✅ Universal + App Links + custom scheme | DNS de `rutasenmx.com` + AASA file validation |

## Orden de ejecución (léase de arriba hacia abajo)

### FASE PRE-LAUNCH — Bloqueadores duros

1. [`01-PROD-SECRETS.md`](./01-PROD-SECRETS.md) — env vars que DEBES pegar en Vercel (o tu host) para que el web arranque siquiera.
2. [`02-DATABASE.md`](./02-DATABASE.md) — crear Postgres productivo + PostGIS + `db:push` + seed.
3. [`03-DNS-AND-DOMAIN.md`](./03-DNS-AND-DOMAIN.md) — registrar `rutasenmx.com`, apuntar a Vercel, DNS para emails.
4. [`04-STRIPE-PRODUCTION.md`](./04-STRIPE-PRODUCTION.md) — activar cuenta live, crear productos, webhook, price IDs.
5. [`05-EMAIL-TRANSACTIONAL.md`](./05-EMAIL-TRANSACTIONAL.md) — SMTP + SPF/DKIM.

### FASE MOBILE — Stores

6. [`06-MOBILE-ASSETS.md`](./06-MOBILE-ASSETS.md) — reemplazar los PNG placeholder con el arte final.
7. [`07-EAS-SETUP.md`](./07-EAS-SETUP.md) — `eas init`, secrets, projectId real, runtime updates.
8. [`08-REVENUECAT-IAP.md`](./08-REVENUECAT-IAP.md) — cuenta RevenueCat + productos IAP en ambas stores.
9. [`09-APPLE-STORE.md`](./09-APPLE-STORE.md) — cuenta developer + App Store Connect + screenshots + metadatos.
10. [`10-GOOGLE-PLAY.md`](./10-GOOGLE-PLAY.md) — cuenta Play Console + listado + data safety form.

### FASE COMPLIANCE

11. [`11-LEGAL-COMPLIANCE.md`](./11-LEGAL-COMPLIANCE.md) — términos, privacidad, GDPR/LFPDPPP, Apple 5.1.1(v) account-delete, age gating.
12. [`12-MONITORING-OBSERVABILITY.md`](./12-MONITORING-OBSERVABILITY.md) — uptime monitor apuntando a `/api/health`, Sentry/Rollbar si quieres.

### FASE POST-LAUNCH

13. [`13-MANUAL-QA-CHECKLIST.md`](./13-MANUAL-QA-CHECKLIST.md) — exactamente qué abrir en el navegador / device real antes de decir "listo".
14. [`14-COULD-NOT-VERIFY.md`](./14-COULD-NOT-VERIFY.md) — cosas que yo no puedo comprobar sin herramientas externas. Te dejo el cómo-probar en cada una.
15. [`15-FUTURE-WORK.md`](./15-FUTURE-WORK.md) — mejoras que no bloquean producción pero que merecen su próximo sprint.
16. [`16-KNOWN-BUGS-AND-GAPS.md`](./16-KNOWN-BUGS-AND-GAPS.md) — **✅ cerrado.** Los 6 bugs originales (favorites, sitemaps, shared trip, account deletion, mobile tsc, a11y) ya están arreglados + testeados. Queda como registro de qué se hizo.

---

## Regla de oro

Si algo está marcado ✅ aquí y no en [PENDING-MANUAL.md](../PENDING-MANUAL.md), ESTE archivo gana — es más nuevo. El `PENDING-MANUAL.md` viejo se va a borrar en cuanto valides esta estructura.
