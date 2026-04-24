# 14 — Cosas que yo no puedo comprobar

Este archivo es honestidad: puse el código, pero no tengo forma de garantizar que las siguientes funcionan end-to-end. Aquí te digo exactamente **qué** dejé, **por qué** no pude probar, y **cómo** tú lo compruebas.

---

## 1. Anti-double-billing end-to-end

**Código**: `src/lib/subscription/current-plan.ts`, `src/app/api/entitlements/route.ts`, `src/app/api/stripe/checkout/route.ts`, `mobile/hooks/useIAP.ts`.

**Por qué no pude**: Requiere una cuenta Stripe activa con productos creados, y una cuenta RevenueCat con sandbox IAP activo. No puedo simular ambos.

**Cómo lo compruebas**: `13-MANUAL-QA-CHECKLIST.md` sección B.5.

**Riesgo si está roto**: crítico — usuario paga dos veces.

---

## 2. Push notifications llegando al device

**Código**: `src/lib/push/send.ts`, `mobile/providers/PushProvider.tsx`, `mobile/lib/push.ts`.

**Por qué no pude**: requiere un device físico con un token Expo real y que el user permita notificaciones.

**Cómo lo compruebas**:
1. Abre el app en un device → permite notificaciones → consulta `SELECT token FROM push_tokens`.
2. Copia uno de esos tokens.
3. Curl manual:
```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H 'content-type: application/json' \
  -d '[{"to":"ExponentPushToken[...]","title":"Test","body":"Funciona","data":{"path":"/conectar/matches"}}]'
```
4. La push debe llegar en 5-30 seg.
5. Tap → la app abre en `/conectar/matches`.

**Riesgo si está roto**: baja retención post-install (los matches/mensajes nunca notifican).

---

## 3. Universal Links (iOS) y App Links (Android)

**Código**: `mobile/app.json` (intent filters + associatedDomains), `mobile/providers/DeepLinkProvider.tsx`, `shared/src/deep-links.ts`.

**Por qué no pude**: requiere servir archivos AASA/assetlinks.json desde el dominio productivo + tener DNS configurado + tener el app firmado.

**Cómo lo compruebas**: `03-DNS-AND-DOMAIN.md` sección "Test end-to-end".

**Riesgo si está roto**: links de marketing / SMS de invitación abren Safari en lugar del app → fricción para retención.

---

## 4. Stripe webhook llegando al servidor productivo

**Código**: `src/app/api/stripe/webhook/route.ts`.

**Por qué no pude**: el webhook solo llega de un Stripe dashboard real a un URL productivo. No puedo simularlo.

**Cómo lo compruebas**:
1. Stripe Dashboard → Developers → Webhooks → tu endpoint → "Send test webhook" → `customer.subscription.updated`
2. Debe aparecer en Vercel logs: `[webhook] ... 200 OK`.
3. Si responde 400 "Invalid signature" → `STRIPE_WEBHOOK_SECRET` no coincide.

**Riesgo si está roto**: Stripe ve pagos; tu DB no → usuarios pagan y siguen en Free.

---

## 5. RevenueCat webhook

**Código**: `src/app/api/iap/sync/route.ts`.

**Por qué no pude**: requiere RevenueCat dashboard configurado.

**Cómo lo compruebas**:
1. RevenueCat Dashboard → Integrations → Webhook → "Send test event"
2. Debe responder `{ ok: true, test: true }`.
3. Con una compra sandbox real: `EVENTS` tab debe mostrar status 200 para `INITIAL_PURCHASE`.

**Riesgo si está roto**: IAPs del mobile nunca sincronizan → users pagan en App Store y siguen viendo "Free" en el app.

---

## 6. PDF watermark gating por plan

**Código**: `mobile/hooks/useExportTrip.ts`, `src/app/api/trips/[id]/export-pdf/*` (si existe en web).

**Por qué no pude**: requiere el app compilado + un user con cada plan para comparar outputs.

**Cómo lo compruebas**: `13-MANUAL-QA-CHECKLIST.md` A.5.

**Riesgo si está roto**: users free exportan sin marca de agua → pierdes incentivo de upgrade.

---

## 7. Cross-region database latency

**Código**: `src/db/index.ts`.

**Por qué no pude**: dependencia de dónde esté deployado Vercel + dónde esté la DB.

**Cómo lo compruebas**:
```bash
curl https://rutasenmx.com/api/health | jq .dbLatencyMs
# Target: <200ms p50. >400ms es problema de región.
```

**Riesgo si está roto**: TTFB del app se siente lento para todos.

---

## 8. Apple App Site Association + assetlinks.json servidos con headers correctos

**Por qué no pude**: no los has creado aún — ver `03-DNS-AND-DOMAIN.md`.

**Cómo lo compruebas**:
```bash
curl -I https://rutasenmx.com/.well-known/apple-app-site-association
# Content-Type DEBE ser application/json (no text/html)

curl https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://rutasenmx.com
# Debe listar tu app sin errores
```

**Riesgo si está roto**: deep links no abren el app.

---

## 9. Stripe price IDs coinciden con los de `.env` productivo

**Código**: `src/lib/subscription/stripe.ts` lee `STRIPE_PRICE_{PLAN}_{INTERVAL}` del env.

**Por qué no pude**: los price IDs son diferentes entre tu cuenta test y live.

**Cómo lo compruebas**:
```bash
# En Vercel production env, verifica que los 4 price IDs empiezan con `price_` y existen en tu Stripe live dashboard:
curl -H "Authorization: Bearer $STRIPE_SECRET_KEY" https://api.stripe.com/v1/prices/$STRIPE_PRICE_PRO_MONTHLY
# Debe devolver 200 con los detalles
```

**Riesgo si está roto**: checkout devuelve 500 — user no puede comprar.

---

## 10. Account deletion web endpoint — ✅ implementado

Status actualizado: existe `DELETE /api/account` + `DeleteAccountPanel` que se auto-abre con `?delete=1`. 9 tests pasando. Lo que SIGUE faltando (no bloquea submit a Apple/Play):
- Cron que hace el **hard delete** físico a 30 días (ver `15-FUTURE-WORK.md` #A).

Lo que debes verificar manualmente antes de lanzar:
```bash
# Autenticado como un user de prueba:
curl -X DELETE https://rutasenmx.com/api/account \
  -H "Cookie: rutasmx_session=<tu-jwt>"
# Esperado: { ok: true, message: "Cuenta eliminada..." }
# Y volver a logear con el mismo email debe fallar ("no existe el user").
```

Y en el browser: `https://rutasenmx.com/perfil?delete=1` debe abrir el modal directamente.
