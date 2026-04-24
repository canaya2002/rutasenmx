# 09 — Apple App Store

**Bloquea:** lanzamiento en iOS. ~$99/año Apple Developer Program.

## 1. Cuenta + Team

- [ ] Inscribirte en `developer.apple.com/programs/enroll` ($99/año)
  - Individual o Organization (Organization necesita D-U-N-S number — trámite de ~1 semana con Dun & Bradstreet)
- [ ] Firmar **Paid Apps Agreement** en App Store Connect (Agreements, Tax, and Banking)
- [ ] Llenar **Tax Forms W-8BEN** (México) con tu RFC

## 2. App Store Connect — crear la app

- [ ] `appstoreconnect.apple.com` → My Apps → **+** → New App
  - Platforms: iOS
  - Name: **Rutas en MX** (máx 30 chars)
  - Primary Language: Spanish (Mexico)
  - Bundle ID: `com.rutasenmx.app` (debe haberse creado en developer.apple.com → Certificates, IDs → Identifiers)
  - SKU: `rutasenmx-ios-01`
- [ ] Anota el **App Store Connect App ID** (número de 10 dígitos) → pégalo en `mobile/eas.json` → `submit.production.ios.ascAppId`
- [ ] Anota el **Apple Team ID** → pégalo en `appleTeamId`
- [ ] Pon tu Apple ID email → `appleId`

## 3. Metadata requerida

En ASC → tu app → **App Information**:

| Campo | Valor sugerido |
|---|---|
| Privacy Policy URL | `https://rutasenmx.com/privacidad` |
| Support URL | `https://rutasenmx.com/ayuda` |
| Marketing URL | `https://rutasenmx.com` |
| Category (Primary) | Travel |
| Category (Secondary) | Social Networking |
| Age Rating | 12+ (por el chat/swipe de Conectar — responde honestamente el cuestionario) |
| Content Rights | You own or licensed all content |

En → **Pricing and Availability**:
- Free (el app es gratis; el IAP maneja el pago)
- Availability → Mexico (puedes añadir US / AR / CO si quieres expandir)

## 4. Version Information

- [ ] **What's New** (release notes): "Versión 1.0 — Planea rutas por México con IA, exporta PDF, conecta con otros viajeros."
- [ ] **Description** (~4000 chars disponibles, usa 1500-2000):
  > Rutas en MX es tu copiloto para viajar por México. Planea tu próximo road trip con Autopilot IA: te sugiere paradas en pueblos mágicos, zonas arqueológicas y museos según tus días, intereses y punto de salida.
  >
  > **Qué puedes hacer:**
  > - Planear viajes con IA (hasta 15 paradas por viaje en Premium)
  > - Descubrir lugares curados por categoría o estado
  > - Exportar tu itinerario a PDF
  > - Guardar viajes favoritos para acceso offline
  > - Conectar con otros viajeros y formar parte de comunidades temáticas
  >
  > **Planes:**
  > - Gratis: 1 viaje guardado, 7 paradas, PDF con marca de agua
  > - Pro ($99/mes): 10 viajes, 50 paradas, IA Autopilot (3/mes), sin anuncios, social
  > - Premium ($299/mes): ilimitado, IA Autopilot (15/mes), offline road mode
  >
  > Las suscripciones se renuevan automáticamente. Puedes cancelarlas en cualquier momento desde los ajustes de tu cuenta en App Store al menos 24 h antes del siguiente período.
- [ ] **Keywords** (100 chars): `méxico,viaje,road trip,rutas,pueblos mágicos,itinerario,IA,mapas`
- [ ] **Promotional Text** (170 chars, cambiable sin nueva review): "Nuevo: Autopilot IA genera tu ruta por México en segundos."
- [ ] **Support URL**: `https://rutasenmx.com/ayuda`
- [ ] **Copyright**: `2026 Rutas en MX`

## 5. Screenshots (OBLIGATORIO)

Necesitas screenshots de las siguientes medidas:

| Device class | Resolución | Cantidad mín | Opcional |
|---|---|---|---|
| iPhone 6.7" (14/15/16 Pro Max) | 1290×2796 | 3 | hasta 10 |
| iPhone 6.5" (antiguos) | 1242×2688 | 3 | hasta 10 |
| iPad Pro 13" | 2048×2732 | 3 (si soportas iPad) | hasta 10 |

Apple requiere el primero y puede usar el mismo para los otros sizes (se escala). Subir 3 del 6.7" ya cubre.

**Mandatorios en tu caso:**
1. Home tab (mapa + explorar)
2. Pantalla de Autopilot generando un itinerario (con el badge verde "IA")
3. Detalle de un viaje con paradas
4. Paywall (/suscripcion) mostrando los planes
5. Conectar (swipe cards)

## 6. In-App Purchase review

Cada IAP necesita su propio review la primera vez:
- [ ] Screenshot de la pantalla de compra (/suscripcion renderizada con el package visible)
- [ ] "Review notes": "This is an auto-renewable subscription. To test, login with sandbox tester, go to Perfil → Ver planes, tap Suscribirme."

## 7. Sign in / Tester account

Apple requiere credenciales para que su equipo pueda probar:
- [ ] Crea un user tester: `reviewer@rutasenmx.com` / `TestPass2026!` con plan Premium ya activo.
- [ ] Ponlos en **App Review Information** → Demo Account.

## 8. Submit

```bash
cd mobile
npm run build:production
# Espera el build (~20 min)
npm run submit:ios
# Esto hace `eas submit -p ios` que sube el IPA automáticamente a ASC.
```

Después en ASC → tu app → "App Store" tab → version 1.0 → **Submit for Review**.

## 9. Review cycle

- Promedio 2024: 24-48 horas.
- Si te rechazan, Apple te explica en ASC → App Review → Messages. La mayoría de rechazos comunes:
  - Missing account deletion (**ya la tienes** en `perfil.tsx` → "Eliminar cuenta")
  - Missing privacy URL (ya apuntas a `/privacidad` — solo asegúrate de que el URL existe y carga)
  - IAP pricing inconsistencies (precios en ASC deben coincidir con lo que se muestra en el paywall)
  - "App is broken" (usualmente un crash durante el review — revisa logs en ASC)

## 10. Post-approval

- [ ] Setea `Available date` = hoy (automáticamente se publica)
- [ ] Setup **Phased Release** (default): 1%→2%→5%→10%→20%→50%→100% en 7 días. Si ves crashes, pausa.
