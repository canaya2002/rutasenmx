# Rutas en MX — Mobile (Expo)

Fase 0 del roadmap descrito en [`../PLAN-MOBILE.md`](../PLAN-MOBILE.md).
Comparte tipos con el web a través de `../shared` (paths de TypeScript).

## Lo que hay hoy (scaffolding)

- Expo Router v4 con file-based routing.
- NativeWind v4 (Tailwind en RN) + tokens de diseño alineados con el web.
- `expo-blur` integrado vía `<GlassCard>` para el look glassmorphic.
- `<MotionPressable>` con Reanimated + haptics.
- `AuthProvider` + `QueryProvider` (TanStack Query con AsyncStorage persistent cache).
- Login / Register / bottom tabs / splash gate.
- Cliente `apiFetch()` con JWT desde SecureStore + timeouts.
- Tipos compartidos en `@shared/*` (plans, social, trips, analytics, entitlements, API paths).

## Lo que **falta** (fases 1-7 del roadmap)

Ver `../PLAN-MOBILE.md` §10.

## Setup local

```bash
cd mobile

# 1) Instalar deps (propias, NO heredadas del web)
npm install

# 2) Arrancar el dev server
npm start

# 3) Abrir en Expo Go o dev client:
#    - press `i` para iOS simulator
#    - press `a` para Android emulator
#    - scan el QR con tu celular (necesita estar en la misma red wifi)
```

Por default apunta a `http://localhost:3000` (el web en dev).
Para apuntar a staging o prod, setea `EXPO_PUBLIC_API_BASE_URL` o edita
`app.json → extra.apiBaseUrl`.

## EAS Build (cloud)

```bash
# 1) Una vez:
npm i -g eas-cli
eas login
eas init        # llena `extra.eas.projectId` en app.json

# 2) Preview (APK / TestFlight build interno)
npm run build:preview

# 3) Producción (subir a stores)
npm run build:production
npm run submit:ios
npm run submit:android
```

## Notas de arquitectura

- **Sin workspaces de npm** entre web y mobile: React Native + monorepo npm
  es frágil. `mobile/` tiene sus propios `node_modules`. Compartimos sólo
  TypeScript fuente vía `@shared/*` en `tsconfig.json` + `metro.config.js`.
- **No cambia nada del web**: el build de Next ignora `mobile/` y `shared/`.

## Próximo paso

Fase 1 — Auth + API real end-to-end probada contra el backend del web corriendo
en `localhost:3000`. Luego Fase 2 (lectura pública), Fase 3 (trips + Autopilot),
Fase 4 (swipe Tinder + comunidades), Fase 5 (IAP + RevenueCat + anti-double-billing),
Fase 6 (push + offline), Fase 7 (polish + QA + submit a stores).
