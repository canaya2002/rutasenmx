# 07 — Expo EAS (builds + updates + submit)

**Bloquea:** cualquier build distribuible. Sin EAS solo puedes correr en Expo Go (no sirve para stores, no corre IAP, no corre push nativo).

## Estado actual del repo

- `mobile/app.json` → `extra.eas.projectId: "TO_BE_CREATED_BY_EAS_INIT"`
- `mobile/app.json` → `updates.url: "https://u.expo.dev/TO_BE_CREATED_BY_EAS_INIT"`
- `mobile/eas.json` → build profiles listos (development / preview / production)
- `mobile/eas.json` → `submit.production.ios` tiene `"TO_BE_SET"` placeholders
- `mobile/package.json` → scripts listos (`build:preview`, `build:production`, `submit:ios`, `submit:android`)

## Pasos, en orden

### 1. Cuenta Expo + EAS CLI

```bash
npm i -g eas-cli
cd mobile
eas login              # usa tu cuenta Expo
eas whoami             # confirma login
```

### 2. Inicializar proyecto EAS

```bash
cd mobile
eas init
# Esto:
#  - Crea el proyecto en expo.dev
#  - Reemplaza los dos "TO_BE_CREATED_BY_EAS_INIT" en app.json con el projectId real
#  - Hace commit automático de app.json (revísalo)
```

### 3. Configurar secrets en EAS (para que `eas build` los inyecte sin que vivan en el repo)

```bash
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "appl_abc123..."
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "goog_xyz789..."
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://...@sentry.io/..."
```

(Estas referencias ya están cableadas en `mobile/eas.json` con `$EXPO_PUBLIC_REVENUECAT_IOS_KEY` etc.)

### 4. Credenciales iOS + Android

```bash
eas credentials -p ios
# Expo puede GENERAR por ti el Apple Distribution cert + provisioning profile.
# Necesitas estar inscrito al Apple Developer Program ($99/año).

eas credentials -p android
# Expo GENERA un keystore por ti. NO LO PIERDAS — si pierdes este keystore,
# Google Play no te deja volver a actualizar tu app. Descarga una copia:
eas credentials -p android --json > mobile/credentials-android-backup.json
# (este archivo debería ir a un password manager, no al repo)
```

### 5. Primer build preview (para TestFlight / internal testing)

```bash
cd mobile
npm run build:preview
# Tarda ~15-25 min. Te da un QR + link para descargar el IPA/APK.
```

### 6. Build productivo

```bash
npm run build:production
# Igual de lento. Al terminar, el IPA queda en expo.dev listo para submit.
```

### 7. Submit a stores

**iOS:**
```bash
# Antes necesitas llenar mobile/eas.json:
# "submit.production.ios": {
#   "appleId": "canayar@manuelsolis.com",     <- tu Apple ID real
#   "ascAppId": "1234567890",                 <- App Store Connect app ID (después de crear la app en ASC)
#   "appleTeamId": "ABC123DEFG"               <- Team ID de developer.apple.com
# }
npm run submit:ios
```

**Android:**
```bash
# Necesitas un service account JSON de Google Play:
#  1. Play Console → Setup → API access → Create new service account
#  2. Google Cloud → IAM → ese service account → Keys → JSON
#  3. Guárdalo como mobile/google-service-account.json
#     (YA ESTÁ EN .gitignore del mobile)
#  4. Play Console → invita al service account con rol "Admin"
npm run submit:android
```

### 8. OTA updates (opcional pero genial)

EAS Update permite empujar cambios de JS/RN sin pasar por review:

```bash
# Después de cada feature menor:
npx expo export --platform all
eas update --channel production --message "Fix bug en chat polling"
```

Los usuarios reciben la update la próxima vez que abren la app. **Regla de oro:** cualquier cambio que toque código nativo (añadir un módulo de RN) **necesita un nuevo build**, no OTA.

### 9. Versionado

`mobile/eas.json` tiene `"autoIncrement": true` para production. Significa que cada `eas build` sube el `buildNumber` (iOS) / `versionCode` (Android) sin tocar `version` en `app.json`. Cuando saques una versión mayor:

```bash
# Edita mobile/app.json → "version": "0.2.0"
# Siguiente build deja buildNumber/versionCode en 1.
```

## Troubleshooting común

- **"Bundle identifier already exists"** → Alguien más registró `com.rutasenmx.app`. Cambia a algo único en `app.json` → `ios.bundleIdentifier` / `android.package`. Actualiza AASA + assetlinks.
- **Build fails con "cocoapods error"** → `eas build` usa caché agresivo. `eas build --clear-cache -p ios`.
- **App crash on launch en TestFlight** → casi siempre es una env var faltante en `eas.json`. Revisa logs con `eas build:view <BUILD_ID>`.
