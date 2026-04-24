# 06 — Assets del mobile

**Estado actual:** carpeta `mobile/assets/` tenía los 5 archivos faltantes hasta hace un momento. Corrí `node mobile/scripts/generate-placeholder-assets.mjs` para crear **placeholders emerald/navy** en las dimensiones correctas. **Debes reemplazarlos con el arte final antes de subir a stores.**

## Archivos actuales (placeholders)

| Archivo | Tamaño | Dónde se usa |
|---|---|---|
| `mobile/assets/icon.png` | 1024×1024 | App icon iOS + fallback Android |
| `mobile/assets/adaptive-icon.png` | 1024×1024 | Android adaptive foreground |
| `mobile/assets/splash.png` | 1242×2436 | Splash screen (todas las plataformas) |
| `mobile/assets/notification-icon.png` | 96×96 | Icono de push notification Android (debe ser blanco sobre transparente real) |
| `mobile/assets/favicon.png` | 48×48 | Web export |

Todos pintan un bloque emerald (#06C167) centrado sobre fondo navy (#0A0F14).

## Reglas por plataforma

### iOS icon (`icon.png`)
- 1024×1024, PNG sin alpha, sin esquinas redondeadas (iOS las redondea).
- No debe incluir texto muy pequeño (Apple lo rechaza).

### Android adaptive icon (`adaptive-icon.png`)
- 1024×1024, PNG con canal alpha.
- Mantener el logo dentro del **66% central** — afuera se recorta.
- Fondo se define por separado en `app.json` → `android.adaptiveIcon.backgroundColor` (hoy: `#0A0F14`).

### Splash screen (`splash.png`)
- 1242×2436 cubre iPhone X y arriba.
- Centrar el logo — expo-splash hace `resizeMode: contain`.
- Fondo sólido navy = mismo color que `app.json → splash.backgroundColor`.

### Notification icon (`notification-icon.png`)
- **Android requiere silueta blanca con alpha transparente.** Si pones colores Android lo renderiza como bloque blanco.
- 96×96 mdpi; Android escala a otros dpi automáticamente.
- Color del accent lo pone `app.json → plugins.expo-notifications.color` (hoy: `#06C167`).

### Favicon web (`favicon.png`)
- 48×48 alcanza. No se usa en mobile builds.

## Otras cosas visuales que hoy no tienes pero necesitarás

| Item | Dónde | Dimensiones / formato |
|---|---|---|
| Hero/banner App Store | App Store Connect | 1024×1024 (diferente al icon) |
| Screenshots App Store | App Store Connect | 1290×2796 (iPhone 6.7"), 8 shots |
| Screenshots Play Store | Play Console | 1080×1920 mínimo, hasta 8 |
| Feature graphic Google Play | Play Console | 1024×500 |
| iOS "App Preview" video (opcional) | | 15-30 seg |
| Promo video Play Store (opcional) | | YouTube link |

## Proceso recomendado

1. Contratar diseñador (Fiverr/Dribbble, ~$100 paquete completo). Darle:
   - El emerald #06C167 y navy #0A0F14 como colores primarios
   - El concepto: "planear rutas por México con Autopilot IA"
   - Las dimensiones de arriba
2. Reemplazar los 5 archivos en `mobile/assets/`.
3. `git add mobile/assets/ && git commit`.
4. Correr `npx expo prebuild --clean` si usaste el modo bare (no necesario para managed).
5. Siguiente `eas build` ya trae los assets correctos.

## Cómo sé si los placeholders se colaron a prod

**Apple va a rechazar el app** con "Metadata Rejected — Icon doesn't comply with guidelines" si subes el placeholder solid-color como está. Google Play lo acepta pero la tasa de instalación cae ~40% según benchmarks de ASO.
