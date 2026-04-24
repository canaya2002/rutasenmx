# 10 — Google Play Store

**Bloquea:** lanzamiento en Android. $25 pago único.

## 1. Cuenta

- [ ] `play.google.com/console/signup` → pagar $25 (una sola vez, no anual)
- [ ] Account Type: Organization (si tienes RFC empresa) o Individual
- [ ] Verificación de identidad: toma 1-7 días. Google pide selfie + identificación.

## 2. Crear la app

- [ ] Play Console → **Create app**
  - Name: **Rutas en MX**
  - Default language: Spanish (Mexico)
  - App or game: App
  - Free or paid: Free
  - Declarations: todas requeridas checked (developer program policies, US export laws)

## 3. Store listing

### Main store listing

| Campo | Valor |
|---|---|
| App name | Rutas en MX |
| Short description (80 chars) | Planea rutas por México con IA. Autopilot, pueblos mágicos, conecta con viajeros. |
| Full description (4000 chars) | (mismo texto que App Store Connect) |
| App icon | 512×512 PNG (distinto al de Apple — **debe tener alpha**, no recorta esquinas) |
| Feature graphic | **1024×500** JPEG/PNG — obligatorio, va arriba del listing |
| Phone screenshots | 2-8 screenshots, **mín 320px, máx 3840px**, ratio entre 16:9 y 9:16 |
| Tablet screenshots | (opcional) |
| Promo video | YouTube URL (opcional) |

### Categorization
- Category: **Travel & Local**
- Tags: Travel, Road trip, Trip planner, Mexico
- Content rating: responde cuestionario → sale "Teen" (por el chat)

### Contact details
- Email: `soporte@rutasenmx.com`
- Phone: tu número
- Website: `https://rutasenmx.com`

## 4. App content (Play Console requiere TODO esto antes de subir un build)

### Privacy policy
- [ ] URL: `https://rutasenmx.com/privacidad`

### App access
- [ ] "All functionality available without special access" → NO, tienes login. Debes:
  - Tener un test account: `reviewer@rutasenmx.com` / `TestPass2026!`
  - Escribir en notes: "Login con el email/pass de arriba. Plan Premium ya activo."

### Ads
- [ ] "Does your app contain ads?" → depends (si activas AdSense). Default: NO.

### Content rating
- [ ] Llena el cuestionario IARC. Honest answers:
  - Contains user-generated content: YES (social + community)
  - Messaging between users: YES (chat)
  - Shared user location: YES (mapa)
  - Sells digital goods: YES (IAP)
  - Violence/sex/etc: NO

### Target audience
- [ ] Age group: **13+** (límite bajo porque tienes chat)
- [ ] "Does your app appeal to children?" → NO

### News app
- [ ] NO

### COVID-19 contact tracing
- [ ] NO

### Data safety (la más larga — Google AI revisa esto)

Para cada tipo de dato que recolectas, declara. Listo te lo desgloso:

| Tipo | ¿Recolectas? | ¿Compartes? | ¿Encriptado? | ¿User puede eliminar? |
|---|---|---|---|---|
| Email address | SÍ | NO | SÍ (TLS) | SÍ (account deletion) |
| Name | SÍ | NO | SÍ | SÍ |
| User IDs | SÍ | NO | SÍ | SÍ |
| Password | SÍ | NO | SÍ (hash bcrypt) | SÍ |
| In-app messages | SÍ | NO | SÍ | SÍ |
| Photos | SÍ (perfil social) | NO | SÍ | SÍ |
| Precise location | SÍ (opcional) | NO | SÍ | SÍ |
| Purchase history | SÍ | NO | SÍ | SÍ (anonimizado) |
| App interactions | SÍ (analytics) | NO | SÍ | SÍ |
| Device IDs | SÍ (push token) | NO | SÍ | SÍ |

Purpose para cada uno: App functionality + Analytics. NUNCA checkes "Advertising or marketing" si no vas a usarlos para eso.

### Government apps
- [ ] NO

### Financial features
- [ ] NO (es una suscripción, no es finanzas).

## 5. Main & Store listing are ready → Release

### Production
```bash
cd mobile
npm run build:production
npm run submit:android
# eas submit sube el AAB (Android App Bundle) al track 'internal' por default.
```

### Tracks
Play Console → Release:
1. **Internal testing** → 100 usuarios, instant. Para ti y tester. Pon el AAB aquí primero.
2. **Closed testing** → 1000 usuarios en una lista. Para beta con usuarios reales.
3. **Open testing** → cualquier persona con el link.
4. **Production** → al público.

Recomiendo: Internal → Closed (con 20 beta testers por 2 semanas) → Production.

## 6. Submit para review

Production track → Create release → pega release notes → **Review release** → **Start rollout to production**.

- Review tarda **4-24h** normalmente.
- Rechazos comunes:
  - Data safety incompleto
  - App crashea en Google's test phone
  - Target API level muy viejo (Expo SDK 54 = API 34, OK hasta 2026)
  - Missing account deletion (**ya lo tienes**)

## 7. Staged rollout

Google default: 1% → monitorea crashes → 20% → 50% → 100% a lo largo de 1 semana. Lo haces manual en la UI.

## 8. Post-launch

- **Play Console → Vitals** → monitor ANR, crash rate. Target < 0.5% crash.
- **Play Console → Reviews** → responde reseñas dentro de 48h para mantener score > 4.0.
