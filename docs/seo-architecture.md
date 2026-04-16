# SEO Architecture -- Rutas en MX

Last updated: 2026-04-16

---

## 1. URL Structure and Canonical Policy

### URL Hierarchy

```
/                                       Home
/estados                                States hub
/estados/{estado-slug}                  State detail
/estados/{estado-slug}/museos           State > Museums
/estados/{estado-slug}/zonas-arqueologicas  State > Arch. zones
/estados/{estado-slug}/pueblos-magicos  State > Pueblos Magicos
/pueblos-magicos                        Pueblos Magicos hub
/pueblos-magicos/{estado-slug}          PM by state
/museos                                 Museums hub
/museos/{estado-slug}                   Museums by state
/zonas-arqueologicas                    Arch. zones hub
/lugares/{slug}                         Individual place detail
/rutas                                  Routes hub
/rutas/{slug}                           Route detail
/colecciones                            Collections hub
/colecciones/{slug}                     Collection detail
/guias                                  Guides hub
/guias/{slug}                           Guide article
/explorar                               Interactive map
/planear                                Trip planner
/precios                                Pricing
/autopilot                              AI trip planner CTA
/acerca-de                              About
/metodologia                            Methodology
/fuentes-de-datos                       Data sources
/contacto                               Contact
/privacidad                             Privacy policy
/terminos                               Terms of service
```

### Canonical Rules

1. **All canonical URLs are absolute**, prefixed with `https://rutasenmx.com`.
2. **No trailing slashes.** A 301 redirect from `/:path+/` to `/:path+` is configured in `next.config.ts`.
3. **Lowercase only.** Slugs are normalized via `normalizeSlug()` in `src/lib/seo/canonical.ts`.
4. **No tracking params.** The `cleanUrl()` utility strips UTM, fbclid, gclid, and 15+ other tracking parameters.
5. **No fragments.** Hash fragments are stripped from canonical URLs.
6. **Query params are sorted** alphabetically for consistency.
7. Each page sets `alternates.canonical` via `buildPageMetadata()` in `src/lib/seo/metadata.ts`.

### Valid Canonical Patterns

Defined in `src/lib/seo/canonical.ts` as `CANONICAL_PATTERNS`:

- `/`
- `/estados/{slug}`
- `/lugares/{slug}`
- `/rutas/{slug}`
- `/museos`, `/museos/{slug}`
- `/zonas-arqueologicas`, `/zonas-arqueologicas/{slug}`
- `/pueblos-magicos`, `/pueblos-magicos/{slug}`
- `/guias/{slug}`
- `/colecciones/{slug}`
- `/estados/{slug}/museos`
- `/estados/{slug}/zonas-arqueologicas`
- `/estados/{slug}/pueblos-magicos`

---

## 2. Indexation Matrix

Defined in `src/lib/seo/indexation.ts` (`PAGE_TYPES`) and `src/lib/seo/robots.ts`.

### Indexed (index, follow)

| Page Type         | Example Path                        | Richness-Dependent |
|-------------------|-------------------------------------|--------------------|
| home              | `/`                                 | No                 |
| estado            | `/estados/oaxaca`                   | No                 |
| lugar             | `/lugares/teotihuacan`              | Yes (min 30)       |
| ruta              | `/rutas/cdmx-oaxaca`               | Yes (min 30)       |
| museo             | `/museos/oaxaca`                    | Yes (min 30)       |
| zona-arqueologica | `/zonas-arqueologicas/chiapas`      | Yes (min 30)       |
| pueblo-magico     | `/pueblos-magicos/jalisco`          | Yes (min 30)       |
| coleccion         | `/colecciones/playas-escondidas`    | No                 |
| guia              | `/guias/ruta-del-vino`              | Yes (min 30)       |
| hub               | `/museos`, `/pueblos-magicos`, etc. | No                 |

### Not Indexed (noindex, nofollow)

| Page Type     | Paths Covered                        |
|---------------|--------------------------------------|
| search        | `/buscar`                            |
| filter        | Any filtered listing with query params |
| auth          | `/iniciar-sesion`, `/registrarse`, `/recuperar-contrasena` |
| dashboard     | `/mis-viajes`, `/favoritos`, `/suscripcion` |
| admin         | `/admin/*`                           |
| checkout      | `/checkout`                          |
| profile       | `/perfil`                            |
| trip-editor   | Trip editing views                   |
| preview       | `/preview/*`                         |
| shared-trip   | Shared trip links                    |

### Robots.txt Disallow

Configured in `src/app/robots.ts`:

```
/admin
/dashboard
/api
/auth
/checkout
/mis-viajes
/perfil
/preview
```

### Richness Scoring

Pages marked as `richnessDependant: true` must score >= 30 out of 100 to be indexed. Scoring rubric (from `calculateRichnessScore()`):

| Signal              | Points |
|---------------------|--------|
| Has description     | 10     |
| Description > 100c  | +5     |
| Description > 300c  | +5     |
| Description > 600c  | +5     |
| Has image           | 10     |
| 3+ images           | +5     |
| 6+ images           | +5     |
| Has coordinates     | 10     |
| Has address         | 5      |
| Has schedule        | 10     |
| Has pricing         | 10     |
| Has ratings         | 10     |
| 1+ related items    | 5      |
| 5+ related items    | +5     |
| **Maximum**         | **100** |

---

## 3. Metadata Strategy by Page Type

All metadata is built via `buildPageMetadata()` from `src/lib/seo/metadata.ts`.

### Root Layout (global defaults)

- `metadataBase`: `https://rutasenmx.com`
- `title.template`: `%s | Rutas en MX`
- `title.default`: `Rutas en MX -- Planea rutas por Mexico, Pueblos Magicos y escapadas`
- `openGraph.locale`: `es_MX`
- `twitter.card`: `summary_large_image`
- `robots`: index, follow, max-image-preview: large, max-snippet: -1

### Per Page Type

| Type              | Title Pattern                                              | Description Source       |
|-------------------|------------------------------------------------------------|--------------------------|
| Home              | Static: brand + tagline                                    | Static                   |
| Estado            | `{Estado} -- Destinos, rutas y lugares | Rutas en MX`      | Dynamic from DB          |
| Hub (museos, etc.)| `{Category} en Mexico | Rutas en MX`                      | Static per hub           |
| Lugar detail      | `{Lugar} -- {Estado} | Rutas en MX`                       | From DB description      |
| Museo detail      | `{Name} -- Museo en {Estado} | Rutas en MX`               | From DB                  |
| Zona detail       | `{Name} -- Zona Arqueologica en {Estado} | Rutas en MX`   | From DB                  |
| Pueblo detail     | `{Name} -- Pueblo Magico en {Estado} | Rutas en MX`       | From DB                  |
| Ruta              | `Ruta {Name} -- {stops} paradas | Rutas en MX`            | From DB                  |
| Guia              | `{Title} | Rutas en MX`                                   | Article excerpt          |
| Coleccion         | `{Title} | Rutas en MX`                                   | Collection description   |
| Auth pages        | `Iniciar sesion | Rutas en MX` (noindex)                   | Static                   |
| Dashboard pages   | `Mis viajes | Rutas en MX` (noindex)                       | Static                   |

---

## 4. JSON-LD Schema Strategy

Schema builders live in `src/lib/seo/schema.ts`. The `<JsonLd>` component in `src/components/seo/JsonLd.tsx` renders them.

### Schema Types by Page

| Page              | Schema Types                            |
|-------------------|-----------------------------------------|
| Home              | `WebSite` + `Organization`              |
| Estado            | `BreadcrumbList` + `ItemList`           |
| Hub (museos, etc.)| `BreadcrumbList` + `CollectionPage`     |
| Lugar detail      | `BreadcrumbList` + `TouristAttraction`  |
| Museo detail      | `BreadcrumbList` + `Museum`             |
| Zona detail       | `BreadcrumbList` + `TouristAttraction`  |
| Pueblo detail     | `BreadcrumbList` + `TouristAttraction`  |
| Ruta              | `BreadcrumbList` + `Trip`               |
| Guia              | `BreadcrumbList` + `Article`            |
| Coleccion         | `BreadcrumbList` + `CollectionPage`     |

### Key Schema Features

- **SearchAction** on `WebSite` schema enables sitelinks search box.
- **GeoCoordinates** included when latitude/longitude are available.
- **AggregateRating** included when reviews exist.
- **OpeningHours** included for museums with schedule data.
- **BreadcrumbList** on all detail pages for rich breadcrumbs in SERPs.

---

## 5. Sitemap Structure

### Static Sitemap

Defined in `src/app/sitemap.ts`. Contains top-level pages:

| URL                       | Priority | Change Freq |
|---------------------------|----------|-------------|
| `/`                       | 1.0      | daily       |
| `/pueblos-magicos`        | 0.9      | weekly      |
| `/museos`                 | 0.9      | weekly      |
| `/zonas-arqueologicas`    | 0.9      | weekly      |
| `/rutas`                  | 0.9      | weekly      |
| `/colecciones`            | 0.8      | weekly      |
| `/guias`                  | 0.8      | weekly      |
| `/precios`                | 0.6      | monthly     |
| `/autopilot`              | 0.7      | monthly     |
| `/acerca-de`              | 0.4      | monthly     |
| `/metodologia`            | 0.4      | monthly     |
| `/fuentes-de-datos`       | 0.4      | monthly     |
| `/contacto`               | 0.3      | monthly     |
| `/privacidad`             | 0.2      | yearly      |
| `/terminos`               | 0.2      | yearly      |

### Sitemap Defaults by Page Type

From `src/lib/seo/sitemap.ts` (`SITEMAP_DEFAULTS`):

| Page Type          | Change Freq | Priority |
|--------------------|-------------|----------|
| home               | daily       | 1.0      |
| estado             | weekly      | 0.9      |
| hub                | weekly      | 0.8      |
| lugar              | weekly      | 0.8      |
| museo              | weekly      | 0.8      |
| zona-arqueologica  | weekly      | 0.8      |
| pueblo-magico      | weekly      | 0.8      |
| ruta               | weekly      | 0.7      |
| guia               | monthly     | 0.7      |
| coleccion          | monthly     | 0.6      |
| categoria-estado   | weekly      | 0.7      |
| static             | monthly     | 0.3      |

### Future: Dynamic Sitemap

When the database grows, `sitemap.ts` should be converted to a dynamic function that queries the DB for all indexable lugar/ruta/guia pages and generates URLs programmatically. Pages with richness score < 30 should be excluded.

---

## 6. Internal Linking Strategy

### Hub-and-Spoke Model

```
                    /
                    |
    +-----------+---+-----------+
    |           |               |
  /museos   /pueblos-magicos  /rutas
    |           |               |
  /museos/{estado}  /pueblos-magicos/{estado}  /rutas/{slug}
    |           |
  /lugares/{slug}  /lugares/{slug}
```

### Link Sources

| From                  | To                                          |
|-----------------------|---------------------------------------------|
| Home hero             | `/planear`, `/explorar`                     |
| Home categories row   | Hub pages (`/museos`, `/pueblos-magicos`, etc.) |
| Home featured routes  | `/rutas/{slug}`                             |
| Home featured pueblos | `/lugares/{slug}`                           |
| Home states grid      | `/estados/{slug}`                           |
| Home SEO block        | Hubs + `/explorar`, `/guias`                |
| Estado detail         | Lugares within state, category sub-pages    |
| Hub (museos, etc.)    | State sub-pages, individual items           |
| Lugar detail          | Related places, parent estado, breadcrumbs  |
| Ruta detail           | Each stop's lugar page, parent estado       |
| Guia article          | Related lugares, rutas, estados             |
| Breadcrumbs           | Parent hierarchy on every detail page       |
| Footer                | Legal, about, methodology, contact          |

### Breadcrumb Hierarchy

Built via `src/lib/seo/breadcrumbs.ts`:

- `Inicio > Estados > {Estado}`
- `Inicio > {Category} > {Estado} > {Lugar}`
- `Inicio > Rutas > {Ruta}`
- `Inicio > {Category}` (hub pages)
- `Inicio > Estados > {Estado} > {Category}` (state-scoped category)

---

## 7. Keyword Ownership System

### Architecture

Defined in `src/lib/seo/cannibalization.ts` with the `OWNERSHIP_REGISTRY`.

### Ownership Rules

| Keyword Pattern                    | Owner URL Pattern                      |
|------------------------------------|----------------------------------------|
| `museos mexico`                    | `/museos`                              |
| `zonas arqueologicas mexico`       | `/zonas-arqueologicas`                 |
| `pueblos magicos mexico`           | `/pueblos-magicos`                     |
| `rutas de viaje mexico`            | `/`                                    |
| `museos {estado}`                  | `/estados/{estado}/museos`             |
| `zonas arqueologicas {estado}`     | `/estados/{estado}/zonas-arqueologicas`|
| `pueblos magicos {estado}`         | `/estados/{estado}/pueblos-magicos`    |
| `que visitar en {estado}`          | `/estados/{estado}`                    |
| `{lugar}` (proper name)           | `/lugares/{lugar}`                     |
| `ruta {ruta}`                      | `/rutas/{ruta}`                        |

### Keyword Templates

Defined in `src/lib/seo/keywords.ts` (`KEYWORD_TEMPLATES`). Each page type has:

- **Primary keyword**: The main term this page targets.
- **Secondary keywords**: Long-tail variants used in descriptions and content.
- **Intent**: `navigational`, `informational`, or `transactional`.

### Cannibalization Detection

`detectCannibalization()` scans page data for overlapping title phrases, H1 text, and explicit keywords. Severity levels:

- **High**: Multiple pages share the same title phrase or H1.
- **Medium**: 3+ pages reference the same keyword.
- **Low**: 2 pages share a keyword via different match types.

Run keyword universe generation: `npx tsx scripts/generate-keyword-universe.ts`

---

## 8. OG Image Strategy

### Implementation

- **Default OG image**: Static file at `/og-default.png` (1200x630).
- **Root-level dynamic image**: `src/app/opengraph-image.tsx` generates a branded PNG using `next/og` `ImageResponse`.
- **Per-page dynamic images**: Generated via `/api/og?type=...&title=...&subtitle=...&image=...`.
- **Helper functions** in `src/lib/seo/og.ts`:
  - `getPlaceOgImage(name, estado, image?)` -- for places
  - `getEstadoOgImage(estadoName, image?)` -- for states
  - `getRutaOgImage(rutaName, stopCount?, image?)` -- for routes
  - `getGuiaOgImage(title, image?)` -- for guides

### OG Image Types

| Type       | Used For                     | Title          | Subtitle             |
|------------|------------------------------|----------------|----------------------|
| `place`    | Lugares, museos, zonas, PMs  | Place name     | Estado name          |
| `estado`   | State pages                  | Estado name    | "Destinos y rutas"   |
| `ruta`     | Route pages                  | Route name     | "{n} paradas"        |
| `guia`     | Guide articles               | Article title  | "Guia de viaje"      |
| `coleccion`| Collections                  | Collection name| --                   |
| `hub`      | Hub/listing pages            | Category name  | --                   |

### Twitter Image

`src/app/twitter-image.tsx` mirrors the OG image for Twitter cards.

---

## 9. Security and Performance Headers

Configured in `next.config.ts`:

| Header                    | Value                                                              |
|---------------------------|--------------------------------------------------------------------|
| X-Frame-Options           | DENY                                                               |
| X-Content-Type-Options    | nosniff                                                            |
| Referrer-Policy           | strict-origin-when-cross-origin                                    |
| Permissions-Policy        | camera=(), microphone=(), geolocation=(self), interest-cohort=()   |
| X-DNS-Prefetch-Control    | on                                                                 |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload                      |

---

## 10. File Reference

| File                                | Purpose                                    |
|-------------------------------------|--------------------------------------------|
| `src/lib/seo/metadata.ts`          | Base + page metadata builders              |
| `src/lib/seo/canonical.ts`         | Canonical URL generation, URL cleaning     |
| `src/lib/seo/robots.ts`            | Indexation policies per page type          |
| `src/lib/seo/schema.ts`            | JSON-LD schema builders (all types)        |
| `src/lib/seo/breadcrumbs.ts`       | Breadcrumb trail builders                  |
| `src/lib/seo/sitemap.ts`           | Sitemap entry defaults and helpers         |
| `src/lib/seo/keywords.ts`          | Keyword cluster templates                  |
| `src/lib/seo/indexation.ts`        | PAGE_TYPES, richness scoring, shouldIndex  |
| `src/lib/seo/cannibalization.ts`   | Keyword ownership registry, detection      |
| `src/lib/seo/og.ts`                | OG image URL builders                      |
| `src/lib/seo/index.ts`             | Barrel exports                             |
| `src/components/seo/JsonLd.tsx`     | JSON-LD rendering component                |
| `src/components/seo/Breadcrumbs.tsx`| Breadcrumb UI component                    |
| `src/components/seo/GoogleAnalytics.tsx` | GA4 script injection                  |
| `src/components/seo/AdSense.tsx`    | Google AdSense integration                 |
| `src/components/seo/SeoImage.tsx`   | SEO-optimized image component              |
| `src/app/sitemap.ts`               | Next.js sitemap route                      |
| `src/app/robots.ts`                | Next.js robots.txt route                   |
| `src/app/manifest.ts`              | PWA manifest                               |
| `src/app/opengraph-image.tsx`       | Root OG image generator                    |
| `src/app/twitter-image.tsx`         | Root Twitter image generator               |
| `scripts/seo-audit.ts`             | Comprehensive SEO audit                    |
| `scripts/validate-sitemaps.ts`      | Sitemap URL validation                     |
| `scripts/validate-schema.ts`        | JSON-LD schema validation                  |
| `scripts/generate-keyword-universe.ts` | Keyword universe generation             |
