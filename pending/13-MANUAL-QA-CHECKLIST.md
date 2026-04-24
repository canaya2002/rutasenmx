# 13 — Manual QA Checklist

**No puedo probar UI yo** (no tengo navegador ni device físico). Este es el script estricto que DEBES correr antes de marcar "listo para producción".

## Setup — 10 minutos antes

- [ ] Branch productivo deployado en `https://rutasenmx.com`
- [ ] `.env` productivo cargado (ver `01-PROD-SECRETS.md`)
- [ ] Una card de prueba: **4242 4242 4242 4242** / 12/30 / 123 (test mode) o una tarjeta real con $1 cargado (live mode)
- [ ] Dos devices: desktop browser + un iPhone o Android físico con el IPA/APK preview instalado (via TestFlight / internal testing)
- [ ] Dos cuentas de email listas: `qa-alpha@gmail.com` y `qa-beta@gmail.com`

---

## A. Web — flujo golden path

### A.1 Homepage
- [ ] `GET https://rutasenmx.com/` carga < 2s
- [ ] Hero muestra call-to-action "Planear viaje"
- [ ] `/precios` muestra 2 tiers (Pro $99, Premium $299) con "Más popular" en Pro
- [ ] Footer muestra links a `/terminos`, `/privacidad`, `/ayuda`

### A.2 Registro + login
- [ ] `/registrarse` con email/pass → redirige a `/` autenticado
- [ ] Logout → `/iniciar-sesion` → re-login → vuelve a funcionar
- [ ] `/iniciar-sesion` con pass incorrecta → mensaje de error en español (no stack trace)
- [ ] Refresh después de login → sigue autenticado (cookie persiste)

### A.3 Autopilot (con ANTHROPIC_API_KEY)
- [ ] `/planear` → wizard se abre
- [ ] Origen "Ciudad de México", Destino "Oaxaca", 5 días, 3 paradas/día
- [ ] "Generar" toma 10-30 seg → itinerario aparece con badge verde "Generado con IA"
- [ ] Badge debe decir "IA" no "Heurística" (confirma que ANTHROPIC_API_KEY funcionó)

### A.4 Autopilot sin API key
- [ ] Borra `ANTHROPIC_API_KEY` temporalmente en Vercel preview
- [ ] Mismo flujo → badge ámbar "Modo heurístico" (pero el app NO se cae)
- [ ] Restaura la key

### A.5 Guardar viaje + PDF
- [ ] En Autopilot → "Guardar viaje" → redirige a `/mis-viajes/[id]`
- [ ] "Exportar PDF" como Free → PDF se descarga CON marca de agua "Gratis — Rutas en MX"
- [ ] Registra nueva cuenta → suscríbete a Pro (ver A.6) → mismo export → **SIN marca de agua**

### A.6 Stripe checkout (TEST mode primero)
- [ ] `/precios` → tap Pro mensual
- [ ] Redirige a Stripe Checkout
- [ ] Tarjeta `4242 4242 4242 4242` → pago OK → redirige a `/suscripcion`
- [ ] Dashboard Stripe → Events → ves `customer.subscription.created` con 200 (del webhook)
- [ ] `/perfil` muestra plan=Pro
- [ ] Verifica en DB: `SELECT plan FROM users WHERE email='tu@email'` → 'pro'

### A.7 Stripe checkout (LIVE mode después)
- [ ] Cambia env a `sk_live_...`
- [ ] Repite A.6 con una tarjeta real ($99 real)
- [ ] Stripe live dashboard ve el pago
- [ ] Cancela desde `/suscripcion` → Billing Portal → "Cancel subscription"
- [ ] Webhook recibe `customer.subscription.deleted` → plan vuelve a 'free' al final del período

### A.8 Social
- [ ] `/conectar` → crear perfil con foto real
- [ ] `/conectar/descubrir` → ves al menos 1 tarjeta
- [ ] Swipe right → si hay match recíproco (prepara 2da cuenta), modal + confetti
- [ ] `/conectar/matches` → lista con el nuevo match
- [ ] `/conectar/chat/[id]` → envía 3 mensajes → polling los refresca en la otra cuenta

### A.9 Comunidad
- [ ] `/comunidad` muestra los 8 foros + canal (del seed)
- [ ] Entrar a un foro → "Crear post" → publica → aparece en feed
- [ ] Otra cuenta comenta → notificación in-app visible

### A.10 Admin
- [ ] `/admin/analytics` solo accesible con `role='admin'`
- [ ] Muestra: eventos últimos 7 días, funnel checkout, save-rate Autopilot
- [ ] `/api/admin/env` devuelve JSON con `state: ok` para todas las required

---

## B. Mobile — flujo golden path

### B.1 Cold start
- [ ] Abre la app → splash con logo emerald → splash desaparece < 3s
- [ ] Si no estás logueado → `/login`
- [ ] Si estás logueado → tabs con Home seleccionado
- [ ] No debe haber "White screen of death" nunca (lo maneja ErrorBoundary)

### B.2 Auth
- [ ] Registrar → el teclado NO tapa el botón "Crear cuenta" (KeyboardAvoidingView)
- [ ] VoiceOver/TalkBack activado: cada input tiene su label leído
- [ ] "Términos" / "Privacidad" al pie abren web en Safari/Chrome

### B.3 Tabs
- [ ] Home → mapa renderiza (si `EXPO_PUBLIC_MAPBOX_TOKEN` está) o fallback
- [ ] Rutas → listado scrollable, tap a uno abre detalle
- [ ] Autopilot → wizard completo → "Guardar" funciona → aparece en mis-viajes
- [ ] Conectar → swipe stack, botones like/pass responsivos
- [ ] Perfil → ve plan, plan link, mis viajes, ayuda, términos, privacidad, **eliminar cuenta**, cerrar sesión

### B.4 Suscripción IAP (requiere sandbox tester iOS / license tester Android)
- [ ] `/suscripcion` muestra offerings de RevenueCat (no "Sin planes disponibles")
- [ ] Tap Pro mensual → sheet nativo de Apple/Google aparece
- [ ] Confirma con sandbox pass → "¡Gracias!" alert
- [ ] Webhook `/api/iap/sync` recibe `INITIAL_PURCHASE`
- [ ] `/perfil` refresca → plan=Pro, source=App Store/Google Play

### B.5 Anti-double-billing
- [ ] Con user que tiene Stripe web Pro activo: `/suscripcion` muestra banner amber + botones deshabilitados
- [ ] Tap en "Suscribirme" → Alert "Ya tienes una suscripción"

### B.6 Push notifications
- [ ] Abrir la app → Alert pide permiso de notificaciones → acepta
- [ ] Desde el backend (o con curl al Expo Push API directamente), envía una push de prueba
- [ ] Llega en 5-30 seg
- [ ] Tap en la push → app abre en la pantalla mapeada por `data.path`

### B.7 Deep links
- [ ] Mandar `https://rutasenmx.com/lugares/teotihuacan` por iMessage / WhatsApp al device
- [ ] Tap → abre **dentro del app** en `/lugar/teotihuacan`, NO en Safari
- [ ] Si abre Safari: AASA mal configurado (ver `03-DNS-AND-DOMAIN.md`)

### B.8 Offline
- [ ] Modo avión ON con la app abierta
- [ ] Banner amber "Sin conexión — mostrando datos guardados" aparece arriba
- [ ] Navegación por mis-viajes, rutas guardadas sigue funcionando (cache)
- [ ] Intentar crear un post en comunidad → error claro "Sin conexión"
- [ ] Modo avión OFF → banner desaparece automáticamente

### B.9 Logout
- [ ] Perfil → Cerrar sesión → Alert confirma
- [ ] Confirmar → vuelve a `/login`
- [ ] Volver a abrir la app → `/login` (no cache del user previo)

### B.10 Error boundary
- [ ] Forzar crash en dev: añade `throw new Error('test')` en cualquier componente
- [ ] Recarga → ves el "Algo salió mal" screen con emerald retry button
- [ ] Tap Retry → recovers (sin crash loop)

---

## C. Performance

### Web
- [ ] `https://pagespeed.web.dev/?url=https://rutasenmx.com` → score ≥ 80 mobile
- [ ] LCP < 2.5s
- [ ] No CLS issues

### Mobile
- [ ] App cold start < 3 seg en iPhone SE / Pixel 5 (tu floor de performance)
- [ ] Swipe stack no drop frames durante gesture
- [ ] Scroll en feed de comunidad no hace "jank"

---

## D. Edge cases que siempre olvidamos

- [ ] Crear cuenta con email ya existente → error claro, no duplica
- [ ] Password con emoji → funciona
- [ ] Usuario cambia foto de perfil → se refleja en comunidad inmediatamente (cache invalidation)
- [ ] User en vuelo/metro (sin internet) abre app → ve cache, no crashea
- [ ] App en background por 2 días → al abrir, token JWT expired → auto-logout silencioso → a /login
- [ ] Registrar con `TU@correo.com` → login funciona con `tu@correo.com` (email case-insensitive)
- [ ] Push cuando app está en foreground → banner in-app, NO notificación nativa (evita redundancia)
