# 11 — Legal y compliance

**Bloquea:** reviews de App Store / Google Play, GDPR (si un europeo usa el app), LFPDPPP (México), demandas futuras.

## 1. Documentos legales a publicar en el web

El mobile ya linkea a estas páginas desde login/register/perfil:
- `https://rutasenmx.com/terminos`
- `https://rutasenmx.com/privacidad`

Deben **existir, cargar, y tener contenido real** antes de submit. Ya hay rutas scaffold en `src/app/(public)/terminos/page.tsx` y `/privacidad/page.tsx`.

### Términos de servicio — secciones mínimas
- Quién eres (Razón Social, RFC, domicilio legal)
- Qué servicio prestas
- Obligaciones del usuario (edad mínima 13, no spam, no scraping)
- Suscripciones: precio, auto-renovación, cómo cancelar (App Store/Play Store settings)
- Propiedad intelectual (contenido UGC es del usuario; tú tienes licencia para mostrarlo)
- Limitación de responsabilidad
- Jurisdicción (sugerido: CDMX, México)
- Cambios a los términos (notificación 30 días)

**Recomendación fuerte:** NO copies-pega de otro SaaS. Consulta abogado (~$5,000 MXN flat para startup).

### Aviso de privacidad — LFPDPPP (México, OBLIGATORIO)
La Ley Federal de Protección de Datos Personales en Posesión de Particulares exige:
- [ ] Identidad y domicilio del responsable
- [ ] Datos personales recabados y finalidad
- [ ] Transferencias a terceros (Stripe, RevenueCat, Anthropic, Neon, etc.)
- [ ] Medios para ejercer derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)
  - Dirección de contacto: `privacidad@rutasenmx.com`
  - Proceso: usuario envía email → respondes en 20 días hábiles
- [ ] Mecanismos para limitar el uso (equivalente a "opt-out")
- [ ] Procedimiento para cambios al aviso

**Plantilla oficial:** `inai.org.mx` tiene un generador gratis.

### GDPR (si aceptas usuarios de la UE)
- [ ] Añadir CMP (cookie consent) — el web no usa muchas cookies hoy, pero analytics GA4 / AdSense sí requieren consent banner
- [ ] Data Processing Agreement firmado con cada processor (Stripe, RevenueCat, Anthropic, Neon ofrecen DPAs estándar)
- [ ] Registro como data controller (si tienes >250 usuarios EU)

## 2. Account deletion — OBLIGATORIO para stores

**Apple Guideline 5.1.1(v)** (desde 2022): si el app crea cuentas, debe permitir eliminarlas **dentro del app** (no solo via web).

Estado actual:
- ✅ El botón "Eliminar cuenta" está visible en `/perfil` del mobile.
- ⚠️ Hoy abre el web (`rutasenmx.com/perfil?delete=1`). Apple acepta esto **solo** si el web completa la eliminación sin fricciones extras.

**Mejor solución (futuro, no bloqueador inmediato):**
Implementar `DELETE /api/account/me` que:
1. Desactive la cuenta (soft delete inmediato)
2. Inicie job async que borre o anonimice:
   - `users`, `profiles`, `social_profiles`
   - `trips`, `trip_days`, `trip_stops`
   - `social_matches`, `social_messages`
   - `push_tokens`, `mobile_subscriptions` (primero cancela en RevenueCat)
   - Subscriptions Stripe → llama Stripe API para cancelar
3. Devuelva 202 con ETA "En 30 días tus datos estarán eliminados"

Mientras tanto, el fallback a web **funciona y es aceptable** según la guideline siempre que el web haga el delete real.

## 3. Age gating

- Mobile declara 12+ / 13+ en stores (ver archivos 09 y 10).
- No tienes validación de edad activa hoy. Si quieres ser estricto:
  - Añadir checkbox "Declaro tener 13+ años" en register (COPPA compliance para US).
  - Añadir date-of-birth en settings sociales (ya tienes `birthdate` opcional en `social_profiles` — úsalo).

## 4. Stripe / pagos México

- [ ] Si facturas >$300k MXN/año, necesitas:
  - Régimen fiscal de Persona Física con Actividad Empresarial o Persona Moral
  - Generar CFDI 4.0 por cada pago (Stripe en MX puede hacerlo automáticamente si activas la integración con Facturama / SW Sapien)
- [ ] Si no, puedes operar como Plataformas Digitales (retención automática por Stripe).

## 5. Contenido UGC (User-Generated Content)

Tienes:
- Comentarios en comunidad
- Mensajes en chat
- Fotos de perfil
- Bio de perfil social

Compliance mínimo:
- ✅ Reporting (ya tienes `src/app/api/social/reports/route.ts`)
- ✅ Blocking (ya tienes `src/app/api/social/blocks/route.ts`)
- ⚠️ Moderación activa — hoy es solo palabras clave + magic bytes. Stores piden **response SLA de 24h** para reportes de contenido objetable. Tienes que:
  - Revisar la cola de reports manualmente cada 24h, O
  - Activar Sightengine (`SIGHTENGINE_USER` + `SIGHTENGINE_SECRET` en env) que modera automáticamente fotos NSFW, O
  - Contratar Trust & Safety team (overkill para MVP).

## 6. Marcas / trademark

- [ ] Verificar que "Rutas en MX" no está registrada por alguien más en IMPI (`impi.gob.mx`)
- [ ] Registrar la marca (~$3,000 MXN, proceso 4-6 meses)
- [ ] Registrar `com.rutasenmx.app` en Apple/Google ASAP para reservar el bundle ID.

## 7. Accesibilidad legal

- **Apple:** no hay requisito legal explícito, pero SI el app no pasa VoiceOver, rechazo es común.
- **EU:** Directiva 2016/2102 aplica a sector público; **no** a app comercial.
- **México:** no hay obligación formal para apps comerciales.

Pero ya mejoré `MotionPressable` para que default `accessibilityRole="button"` y los forms de login/register tienen labels — pasa pruebas básicas de VoiceOver / TalkBack.
