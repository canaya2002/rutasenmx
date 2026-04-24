# 04 — Stripe producción

**Bloquea:** todos los pagos del web. (Mobile usa IAP — ver `08-REVENUECAT-IAP.md`.)

## 1. Activar la cuenta

- [ ] En `dashboard.stripe.com` → toggle superior derecho de **Test mode** → **Live mode**.
- [ ] Completar KYC (Stripe lo pide para procesar pagos reales en México):
  - RFC de la empresa o persona física
  - Cuenta bancaria mexicana (CLABE)
  - Identificación oficial
  - Verificación toma 1-3 días hábiles

## 2. Crear productos

En **live mode**, replica los productos que existían en test.

Hay un script que hace esto automático:
```bash
# Apunta STRIPE_SECRET_KEY a sk_live_... y corre
npm run setup:stripe
# Crea: Pro ($99/mo, $999/año), Premium ($299/mo, $2,999/año)
# Imprime los price IDs en stdout — copia y pégalos a .env (Vercel):
#   STRIPE_PRICE_PRO_MONTHLY=price_...
#   STRIPE_PRICE_PRO_ANNUAL=price_...
#   STRIPE_PRICE_PREMIUM_MONTHLY=price_...
#   STRIPE_PRICE_PREMIUM_ANNUAL=price_...
```

Si prefieres hacerlo a mano: Dashboard → Products → Add product. El código **SOLO lee de env**, no del nombre.

## 3. Webhook productivo

- [ ] Dashboard → Developers → Webhooks → **Add endpoint**
- [ ] Endpoint URL: `https://rutasenmx.com/api/stripe/webhook`
- [ ] **Eventos a suscribir** (5 obligatorios — menos que esto hace que las suscripciones no se sincronicen):
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Copia el **Signing secret** (`whsec_...`) → pégalo en `STRIPE_WEBHOOK_SECRET` (Vercel).

## 4. Habilitar métodos de pago para México

Dashboard → Settings → Payment methods:
- ✅ Card (Visa, Mastercard, Amex)
- ✅ OXXO (muy pedido en MX)
- ✅ SPEI (transferencia bancaria)
- Opcionalmente: Apple Pay, Google Pay

## 5. Billing Portal (gestión de suscripción desde el web)

Dashboard → Settings → Billing → **Customer portal**:
- ✅ Allow customers to update payment method
- ✅ Allow customers to cancel subscription
- ✅ Allow customers to switch plans

El código ya tiene `/api/stripe/portal` listo — solo prende la feature en el dashboard.

## 6. Protección anti-doble-cobro (cross-platform)

Ya tienes código que:
- En `/api/stripe/checkout`: si el user tiene IAP activo en mobile, devuelve **409** con mensaje explicativo.
- En `/suscripcion` del mobile: si el user tiene Stripe web activo, deshabilita el botón de compra IAP y muestra banner "gestiona en rutasenmx.com".

**No hay nada que configurar**, solo verifica con el QA checklist del `13-MANUAL-QA-CHECKLIST.md`.

## 7. Test post-deploy

```bash
# 1. Register → login como usuario free
# 2. /precios → Suscribirme a Pro → paga con tarjeta 4242 4242 4242 4242 (live mode NO la acepta)
#    Usa una real pequeña o test con una tarjeta prepagada en $1 MXN
# 3. Verifica que /api/entitlements devuelve plan='pro'
# 4. Stripe dashboard → Events → debe aparecer customer.subscription.updated con 200 OK
```

## 8. Modo test ↔ live: CUIDADO

- Price IDs de test **no funcionan** en live.
- Webhook signing secrets son distintos en test vs live.
- El env var `STRIPE_SECRET_KEY` controla todo — si empieza con `sk_test_` estás en test, con `sk_live_` en live.
- En Vercel puedes setear distintos valores por environment (preview vs production) — recomiendo:
  - **Preview** (`*.vercel.app`): `sk_test_...`
  - **Production** (`rutasenmx.com`): `sk_live_...`
