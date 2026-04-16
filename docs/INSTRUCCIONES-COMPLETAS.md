# Instrucciones completas: Rutas en MX

## Estado actual del proyecto

### Build y tests
- Build de produccion: PASA (0 errores TypeScript)
- Tests unitarios: 248/248 PASAN
- Rutas generadas: 73+ rutas (incluyendo SSG con parametros dinamicos)
- Tests E2E: configurados pero sin tests escritos aun

### Lo que esta LISTO y funcional

#### Infraestructura
- [x] Next.js 16 + TypeScript + App Router
- [x] PostgreSQL + PostGIS schema (35 tablas via Drizzle ORM)
- [x] Docker Compose (Postgres, Redis, MinIO)
- [x] .env.example completo
- [x] Seguridad: HSTS, X-Frame-Options, CSP headers

#### Paginas publicas (SEO)
- [x] Home (/)
- [x] Pueblos Magicos hub + por estado + (lugar via /lugares/[slug])
- [x] Museos hub + por estado
- [x] Zonas Arqueologicas hub + por estado
- [x] Estados hub + detalle por estado (32 estados)
- [x] Rutas hub + detalle por ruta (8 rutas seed)
- [x] Lugares detalle (35+ lugares seed)
- [x] Colecciones hub + detalle por coleccion
- [x] Guias hub + detalle por guia (5 guias seed)
- [x] Precios
- [x] Explorar (mapa interactivo)
- [x] Planear (trip planner)
- [x] Autopilot IA
- [x] Acerca de
- [x] Contacto
- [x] Privacidad
- [x] Terminos
- [x] Fuentes de datos
- [x] Metodologia
- [x] Politica editorial
- [x] Correcciones

#### Autenticacion
- [x] Login / Registro / Recuperar contrasena (UI)
- [x] API de auth (JWT con jose + bcrypt)
- [x] Session management
- [x] Middleware de proteccion

#### Dashboard de usuario
- [x] Mis viajes (listado)
- [x] Detalle de viaje / editor
- [x] Favoritos
- [x] Perfil
- [x] Suscripcion

#### Admin panel
- [x] Dashboard
- [x] Gestion de lugares
- [x] Gestion de categorias
- [x] Importaciones
- [x] Planes y pricing
- [x] Deals
- [x] Feature flags
- [x] Auditoria

#### Componentes
- [x] Header + Footer + Mobile Nav
- [x] Mapa interactivo (MapView, MapProvider, MapFilters, MapSidebar, etc.)
- [x] Trip Planner + Itinerary Builder + Drag & Drop
- [x] Export menu (GPX/PDF)
- [x] Route Preview
- [x] Discovery Panel
- [x] Pricing Table
- [x] Upgrade Modal
- [x] Autopilot Wizard
- [x] Breadcrumbs con JSON-LD
- [x] JsonLd component
- [x] AdSense component
- [x] Google Analytics component
- [x] 14 UI components (Radix + Tailwind)

#### SEO
- [x] Metadata dinamica por tipo de pagina
- [x] Canonical URLs
- [x] Sitemaps segmentados (9 sitemaps)
- [x] robots.ts
- [x] OpenGraph images dinamicas
- [x] Twitter Card images
- [x] JSON-LD schemas (Organization, WebSite, BreadcrumbList, CollectionPage, Place, Museum, Article, Route)
- [x] Keyword universe + clusters
- [x] Anti-canibalizacion engine
- [x] Indexation matrix
- [x] SEO audit script
- [x] Schema validation script
- [x] Sitemap validation script
- [x] manifest.ts (PWA)

#### API Routes
- [x] /api/auth/* (login, register, logout, me)
- [x] /api/places (listado con filtros)
- [x] /api/places/[slug] (detalle)
- [x] /api/search (busqueda)
- [x] /api/favorites (guardar/listar)
- [x] /api/trips (CRUD)
- [x] /api/trips/[id] (detalle/editar/borrar)
- [x] /api/ai/autopilot (generacion IA)
- [x] /api/stripe/* (checkout, portal, webhook)
- [x] /api/og (OpenGraph image generation)

#### Providers/Adapters
- [x] Mapbox (mapa, geocoding)
- [x] Stripe (pagos, suscripciones)
- [x] INEGI (ruteo)
- [x] Booking.com (hospedaje)
- [x] Email (SMTP)
- [x] Storage (S3/MinIO)
- [x] AI (Anthropic/OpenAI)

#### Datos seed
- [x] 32 estados de Mexico
- [x] 64 Pueblos Magicos
- [x] 32 zonas arqueologicas
- [x] 35+ lugares con descripcion, coordenadas, badges
- [x] 8 rutas tematicas
- [x] 5 articulos/guias editoriales
- [x] 5 colecciones curadas
- [x] Keyword universe y clusters SEO

#### Importadores
- [x] SECTUR Pueblos Magicos
- [x] SIC Museos
- [x] INAH Zonas Arqueologicas
- [x] Seed script desde JSON

---

## Lo que FALTA por hacer (TU LADO - Carlos)

### Prioridad CRITICA (necesario para produccion)

#### 1. Obtener y configurar API keys
Todas estas van en `.env.local`:

| Servicio | Como obtenerla | Variable |
|----------|---------------|----------|
| **Mapbox** | https://account.mapbox.com/access-tokens/ (crear cuenta, plan gratis disponible) | `NEXT_PUBLIC_MAPBOX_TOKEN`, `MAPBOX_SECRET_TOKEN` |
| **Stripe** | https://dashboard.stripe.com/apikeys (crear cuenta, modo test disponible) | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Anthropic** | https://console.anthropic.com/ (para Autopilot IA) | `ANTHROPIC_API_KEY` |
| **INEGI** | https://gaia.inegi.org.mx/sakbe_v3.1/genera_token.jsp | `INEGI_TOKEN` |
| **Google AdSense** | https://www.google.com/adsense/ (aplicar con el dominio) | `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` |
| **Google Analytics** | https://analytics.google.com/ (crear propiedad) | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| **Google Search Console** | https://search.google.com/search-console/ (verificar dominio) | `GOOGLE_SITE_VERIFICATION` |

#### 2. Configurar Stripe
1. Crear productos y precios en el dashboard de Stripe:
   - Plan Basic: mensual y anual
   - Plan Pro: mensual y anual
   - Plan Premium: mensual y anual (con trial de 7 dias)
2. Actualizar los `stripePriceId` en `src/lib/subscription/plans.ts` con los IDs reales
3. Configurar webhook en Stripe dashboard:
   - URL: `https://rutasenmx.com/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Guardar el webhook secret en `STRIPE_WEBHOOK_SECRET`

#### 3. Configurar dominio rutasenmx.com
1. Registrar dominio (si no esta registrado)
2. Configurar DNS hacia Vercel (o tu hosting)
3. Configurar SSL (automatico en Vercel)

#### 4. Configurar base de datos de produccion
Opciones recomendadas:
- **Neon** (PostgreSQL serverless, gratis para empezar)
- **Supabase** (PostgreSQL + extras)
- **Railway** (PostgreSQL simple)
- **PlanetScale** (no soporta PostGIS, evitar si necesitas geo)

Importante: necesitas PostGIS si quieres busquedas geoespaciales a nivel DB.

Pasos:
1. Crear instancia PostgreSQL
2. Habilitar extension PostGIS: `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Configurar `DATABASE_URL` en produccion
4. Ejecutar `npm run db:push` contra la DB de produccion
5. Ejecutar `npm run import:seed` para poblar datos iniciales

#### 5. Deploy en Vercel
1. Conectar repo a Vercel
2. Configurar todas las variables de entorno
3. Build command: `npm run build`
4. Output directory: `.next`
5. Node.js version: 20.x

#### 6. Configurar Google Search Console
1. Verificar propiedad del dominio
2. Enviar sitemaps:
   - `https://rutasenmx.com/sitemap.xml`
   - `https://rutasenmx.com/estados/sitemap.xml`
   - `https://rutasenmx.com/pueblos-magicos/sitemap.xml`
   - `https://rutasenmx.com/museos/sitemap.xml`
   - `https://rutasenmx.com/zonas-arqueologicas/sitemap.xml`
   - `https://rutasenmx.com/rutas/sitemap.xml`
   - `https://rutasenmx.com/lugares/sitemap.xml`
   - `https://rutasenmx.com/colecciones/sitemap.xml`
   - `https://rutasenmx.com/guias/sitemap.xml`

### Prioridad ALTA (mejorar la experiencia)

#### 7. Subir imagenes reales
El sistema esta preparado para imagenes via S3/MinIO pero actualmente las URLs de imagenes son placeholders. Necesitas:
- Fotos de cada Pueblo Magico
- Fotos de museos
- Fotos de zonas arqueologicas
- Fotos de estados
- Logo de Rutas en MX
- Favicon real

#### 8. Configurar Booking.com API
1. Aplicar al programa de afiliados: https://developers.booking.com/
2. Obtener API key y affiliate ID
3. Configurar en `.env.local`

#### 9. Configurar email transaccional
Opciones:
- **Resend** (mas simple)
- **SendGrid**
- **Amazon SES**
- **SMTP propio**

Configurar las variables SMTP en `.env.local`.

---

## i18n (Internacionalizacion)

El sistema de i18n esta LISTO con:
- [x] Locales soportados: `es` (español de México) y `en` (inglés)
- [x] Diccionarios completos en `src/lib/i18n/locales/es.json` y `en.json`
- [x] Middleware que detecta idioma por cookie > Accept-Language header > default (es)
- [x] `LocaleProvider` para componentes cliente con `useLocale()` y `useTranslation()`
- [x] `getLocale()` y `getTranslations()` para server components
- [x] `LanguageSwitcher` en el header (toggle ES/EN)
- [x] Cookie persistente `rutasmx_locale` por 1 año
- [x] `<html lang>` dinámico según locale

Para usar traducciones en server components:
```tsx
import { getTranslations } from '@/lib/i18n/server';
const t = await getTranslations();
// t.hero.title, t.common.search, etc.
```

Para usar en client components:
```tsx
import { useTranslation } from '@/components/providers/LocaleProvider';
const t = useTranslation();
// t.hero.title, etc.
```

## Lo que FALTA por hacer (MI LADO - Claude)

### Cosas que puedo hacer en sesiones futuras

#### Prioridad ALTA
1. **Conectar API routes a DB real** - Cuando tengas la DB configurada, puedo cambiar los endpoints de mock data a queries Drizzle reales
2. **Escribir tests E2E** - Los config de Playwright estan listos, falta escribir los tests
3. **Completar la pagina /compartido/[token]** - Shared trip viewer (actualmente placeholder)
4. **Implementar busqueda real en SearchBar** - Actualmente muestra "Buscando..." sin resultados
5. **Implementar geocoding real** - TripPlanner y AutopilotWizard usan coords stub, necesitan Mapbox Geocoding API

#### Prioridad MEDIA
6. **Crear importadores faltantes:**
   - Atlas Turistico (SECTUR)
   - RNT/DataTur (prestadores turisticos)
   - Script de deduplicacion
   - Script de reindex
7. **Implementar colaboracion en viajes** - UI y API para invitar editores/viewers
8. **Implementar sistema de reviews** - Permitir a usuarios dejar resenas en lugares
9. **Mejorar el pipeline de IA Autopilot** - Feedback loop, regeneracion parcial
10. **Implementar offline/PWA** - Service worker para cache de viajes

#### Prioridad BAJA
11. **Dashboard de analytics admin** - Graficas de uso, clicks, conversiones
12. **Moderacion de reviews** - Cola de aprobacion en admin
13. **Rate limiting** - Implementar en API routes criticos
14. **Logging estructurado** - Integrar con un servicio de logging
15. **Mejorar la pagina 404** - Sugerencias de busqueda

---

## Resumen de bugs corregidos en esta sesion

1. **AutopilotWizard** - Import default vs named export, prop `onComplete` obligatorio -> opcional
2. **drizzle.config.ts** - Path incorrecto al schema (`src/db/schema/index.ts` -> `src/db/schema.ts`)
3. **package.json** - Scripts apuntaban a `src/scripts/` (no existe) en vez de `scripts/`
4. **PricingTable** - Typo `ano` -> `año`
5. **canonical.ts** - No colapsaba doble slashes en path
6. **cannibalization.ts** - Template `{lugar}` atrapaba cualquier texto -> removido
7. **seed.ts** - Columnas inexistentes en schema (`stateSlug`, `category`, `status`, `sourceAttribution`)
8. **OG image route** - `getIcon()` retornaba strings vacios -> agregados iconos unicode
9. **AI pipeline** - Filtro de mustVisit creaba duplicados -> simplificado
10. **Tests** - Instalacion de `jsdom` faltante, regex de test canonico incorrrecto
11. **Breadcrumbs** - Paginas nuevas necesitaban `href` en todos los items

## Paginas creadas en esta sesion

1. `/admin/feature-flags` - Tabla de feature flags
2. `/admin/auditoria` - Registro de auditorias
3. `/colecciones` - Hub de colecciones
4. `/colecciones/[slug]` - Detalle de coleccion
5. `/guias/[slug]` - Detalle de guia (directorio existia vacio)
6. `/fuentes-de-datos` - Pagina de fuentes de datos
7. `/metodologia` - Pagina de metodologia
8. `/politica-editorial` - Politica editorial
9. `/correcciones` - Pagina de correcciones
10. `scripts/seed.ts` - Script de seed desde JSON

---

## Comandos para verificar en local

```bash
# Instalar dependencias
npm install

# Levantar infraestructura (PostgreSQL, Redis, MinIO)
docker compose up -d

# Crear tablas
npm run db:push

# Poblar datos iniciales
npm run import:seed

# Verificar build
npm run build

# Ejecutar tests
npm run test

# Auditoria SEO
npm run seo:audit

# Iniciar dev server
npm run dev
```

## Arquitectura de monetizacion

### Google AdSense
- Componente `<AdSense>` listo en `src/components/seo/AdSense.tsx`
- Se suprime automaticamente para planes Pro y Premium (`suppressAd` prop)
- Configurar `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` en produccion

### Stripe Subscriptions
- 4 planes: Free, Basic ($99/mes), Pro ($199/mes), Premium ($399/mes)
- Precios anuales con descuento
- Trial de 7 dias en Premium
- Webhooks configurados para lifecycle completo
- Entitlements por plan (maxTrips, maxStops, exportacion, colaboracion, IA, etc.)

### Afiliados
- Booking.com adapter listo
- Tabla `affiliate_clicks` para tracking
- UTM generation automatica
- Click logs por partner

### Sponsored placements
- Tabla `sponsored_placements` lista
- Tipos: map_pin, listing, featured, banner
- Gestion desde admin panel
