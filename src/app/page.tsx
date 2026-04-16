import Link from 'next/link';
import type { Metadata } from 'next';
import { HeroSearch } from '@/components/layout/HeroSearch';
import { getLocale, getTranslations } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Rutas en MX — Planea rutas por México, Pueblos Mágicos y escapadas',
  alternates: { canonical: 'https://rutasenmx.com' },
};

const CATEGORIES_ES = [
  { label: 'Pueblos Mágicos', href: '/pueblos-magicos', emoji: '\u2728' },
  { label: 'Museos', href: '/museos', emoji: '\uD83C\uDFDB\uFE0F' },
  { label: 'Zonas arqueológicas', href: '/zonas-arqueologicas', emoji: '\uD83C\uDFDB\uFE0F' },
  { label: 'Playas', href: '/lugares?tipo=playas', emoji: '\uD83C\uDFD6\uFE0F' },
  { label: 'Cenotes', href: '/lugares?tipo=cenotes', emoji: '\uD83D\uDCA7' },
  { label: 'Cascadas', href: '/lugares?tipo=cascadas', emoji: '\uD83C\uDF0A' },
  { label: 'Rutas', href: '/rutas', emoji: '\uD83D\uDEE3\uFE0F' },
  { label: 'Viñedos', href: '/lugares?tipo=vinedos', emoji: '\uD83C\uDF47' },
  { label: 'Ciudades coloniales', href: '/lugares?tipo=coloniales', emoji: '\u26EA' },
  { label: 'Reservas naturales', href: '/lugares?tipo=reservas', emoji: '\uD83C\uDF3F' },
] as const;

const CATEGORIES_EN = [
  { label: 'Pueblos Mágicos', href: '/pueblos-magicos', emoji: '\u2728' },
  { label: 'Museums', href: '/museos', emoji: '\uD83C\uDFDB\uFE0F' },
  { label: 'Archaeological zones', href: '/zonas-arqueologicas', emoji: '\uD83C\uDFDB\uFE0F' },
  { label: 'Beaches', href: '/lugares?tipo=playas', emoji: '\uD83C\uDFD6\uFE0F' },
  { label: 'Cenotes', href: '/lugares?tipo=cenotes', emoji: '\uD83D\uDCA7' },
  { label: 'Waterfalls', href: '/lugares?tipo=cascadas', emoji: '\uD83C\uDF0A' },
  { label: 'Routes', href: '/rutas', emoji: '\uD83D\uDEE3\uFE0F' },
  { label: 'Vineyards', href: '/lugares?tipo=vinedos', emoji: '\uD83C\uDF47' },
  { label: 'Colonial cities', href: '/lugares?tipo=coloniales', emoji: '\u26EA' },
  { label: 'Nature reserves', href: '/lugares?tipo=reservas', emoji: '\uD83C\uDF3F' },
] as const;

const FEATURED_ROUTES_ES = [
  {
    slug: 'cdmx-a-oaxaca-por-puebla',
    title: 'CDMX a Oaxaca',
    description: 'De la capital al corazón mezcalero pasando por Puebla y la Mixteca.',
    distance: '460 km',
    duration: '3 días',
    stops: 8,
  },
  {
    slug: 'ruta-maya-yucatan',
    title: 'Ruta Yucatán',
    description: 'Cenotes, zonas arqueológicas mayas y playas caribeñas.',
    distance: '680 km',
    duration: '5 días',
    stops: 12,
  },
  {
    slug: 'valle-de-guadalupe-ensenada',
    title: 'Ruta del Vino',
    description: 'Valle de Guadalupe, Ensenada y la costa del Pacífico bajacaliforniano.',
    distance: '320 km',
    duration: '2 días',
    stops: 6,
  },
  {
    slug: 'chiapas-arqueologia-naturaleza',
    title: 'Ruta Chiapas',
    description: 'Selva lacandona, cascadas de Agua Azul, Palenque y San Cristóbal.',
    distance: '540 km',
    duration: '4 días',
    stops: 10,
  },
] as const;

const FEATURED_ROUTES_EN = [
  {
    slug: 'cdmx-a-oaxaca-por-puebla',
    title: 'Mexico City to Oaxaca',
    description: 'From the capital to the heart of mezcal country through Puebla and the Mixteca.',
    distance: '460 km',
    duration: '3 days',
    stops: 8,
  },
  {
    slug: 'ruta-maya-yucatan',
    title: 'Yucatán Route',
    description: 'Cenotes, Mayan archaeological sites and Caribbean beaches.',
    distance: '680 km',
    duration: '5 days',
    stops: 12,
  },
  {
    slug: 'valle-de-guadalupe-ensenada',
    title: 'Wine Route',
    description: 'Valle de Guadalupe, Ensenada and the Baja California Pacific coast.',
    distance: '320 km',
    duration: '2 days',
    stops: 6,
  },
  {
    slug: 'chiapas-arqueologia-naturaleza',
    title: 'Chiapas Route',
    description: 'Lacandon jungle, Agua Azul waterfalls, Palenque and San Cristóbal.',
    distance: '540 km',
    duration: '4 days',
    stops: 10,
  },
] as const;

const FEATURED_PUEBLOS_ES = [
  {
    slug: 'real-de-catorce',
    name: 'Real de Catorce',
    state: 'San Luis Potosí',
    description: 'Pueblo fantasma en la sierra con historia minera y misticismo huichol.',
  },
  {
    slug: 'bacalar',
    name: 'Bacalar',
    state: 'Quintana Roo',
    description: 'La laguna de los siete colores rodeada de naturaleza y tranquilidad.',
  },
  {
    slug: 'taxco',
    name: 'Taxco',
    state: 'Guerrero',
    description: 'Capital de la plata con calles empedradas y arquitectura barroca.',
  },
  {
    slug: 'san-cristobal-de-las-casas',
    name: 'San Cristóbal de las Casas',
    state: 'Chiapas',
    description: 'Ciudad colonial en los Altos de Chiapas con mercados y cultura tzotzil.',
  },
  {
    slug: 'patzcuaro',
    name: 'Pátzcuaro',
    state: 'Michoacán',
    description: 'Lago, islas y la tradición purépecha del Día de Muertos.',
  },
  {
    slug: 'tepoztlan',
    name: 'Tepoztlán',
    state: 'Morelos',
    description: 'Cerros místicos, mercado artesanal y el Tepozteco prehispánico.',
  },
] as const;

const FEATURED_PUEBLOS_EN = [
  {
    slug: 'real-de-catorce',
    name: 'Real de Catorce',
    state: 'San Luis Potosí',
    description: 'Ghost town in the mountains with mining history and Huichol mysticism.',
  },
  {
    slug: 'bacalar',
    name: 'Bacalar',
    state: 'Quintana Roo',
    description: 'The lagoon of seven colors surrounded by nature and tranquility.',
  },
  {
    slug: 'taxco',
    name: 'Taxco',
    state: 'Guerrero',
    description: 'Silver capital with cobblestone streets and baroque architecture.',
  },
  {
    slug: 'san-cristobal-de-las-casas',
    name: 'San Cristóbal de las Casas',
    state: 'Chiapas',
    description: 'Colonial city in the Chiapas highlands with markets and Tzotzil culture.',
  },
  {
    slug: 'patzcuaro',
    name: 'Pátzcuaro',
    state: 'Michoacán',
    description: 'Lake, islands and the Purépecha tradition of Day of the Dead.',
  },
  {
    slug: 'tepoztlan',
    name: 'Tepoztlán',
    state: 'Morelos',
    description: 'Mystical hills, artisan market and the pre-Hispanic Tepozteco.',
  },
] as const;

const STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila',
  'Colima', 'Durango', 'Guanajuato', 'Guerrero',
  'Hidalgo', 'Jalisco', 'Estado de México', 'Michoacán',
  'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
  'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
] as const;

function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const isEn = locale === 'en';

  const CATEGORIES = isEn ? CATEGORIES_EN : CATEGORIES_ES;
  const FEATURED_ROUTES = isEn ? FEATURED_ROUTES_EN : FEATURED_ROUTES_ES;
  const FEATURED_PUEBLOS = isEn ? FEATURED_PUEBLOS_EN : FEATURED_PUEBLOS_ES;

  const stopsLabel = isEn ? 'stops' : 'paradas';
  const stepLabel = isEn ? 'Step' : 'Paso';
  const comingSoonLabel = isEn ? 'Coming soon' : 'Próximamente';
  const tryNowLabel = isEn ? 'Try it now' : 'Probar ahora';

  const HOW_IT_WORKS = [
    {
      step: 1,
      title: t.howItWorks.step1Title,
      description: t.howItWorks.step1Desc,
      icon: '\uD83D\uDCCD',
    },
    {
      step: 2,
      title: t.howItWorks.step2Title,
      description: t.howItWorks.step2Desc,
      icon: '\uD83D\uDDFA\uFE0F',
    },
    {
      step: 3,
      title: t.howItWorks.step3Title,
      description: t.howItWorks.step3Desc,
      icon: '\uD83D\uDCCB',
    },
  ];

  const seoTitle = isEn ? 'Road trips in Mexico' : 'Viajes por carretera en México';
  const seoP1 = isEn
    ? <>Mexico is an ideal country to explore by road. From the Pacific coast to the Yucatan peninsula, every kilometer offers unique landscapes, flavors and culture. <strong>Rutas en MX</strong> helps you plan itineraries that combine <Link href="/pueblos-magicos">Pueblos Magicos</Link>, <Link href="/zonas-arqueologicas">archaeological zones</Link>, <Link href="/museos">museums</Link> and natural destinations to make every trip unforgettable.</>
    : <>México es un país ideal para recorrer por carretera. Desde las costas del Pacífico hasta la península de Yucatán, cada kilómetro ofrece paisajes, sabores y cultura únicos. <strong>Rutas en MX</strong> te ayuda a planear itinerarios que combinan <Link href="/pueblos-magicos">Pueblos Mágicos</Link>, <Link href="/zonas-arqueologicas">zonas arqueológicas</Link>, <Link href="/museos">museos</Link> y destinos naturales para que cada viaje sea inolvidable.</>;
  const seoP2 = isEn
    ? <>Explore our <Link href="/rutas">curated routes</Link> or create your own by choosing stops on the <Link href="/explorar">interactive map</Link>. Check our <Link href="/guias">travel guides</Link> for tips on roads, toll costs, best travel seasons and local recommendations.</>
    : <>Explora nuestras <Link href="/rutas">rutas curadas</Link> o crea la tuya propia eligiendo paradas en el <Link href="/explorar">mapa interactivo</Link>. Consulta nuestras <Link href="/guias">guías de viaje</Link> para tips sobre carreteras, costos de casetas, mejores épocas para viajar y recomendaciones locales.</>;
  const seoP3 = isEn
    ? 'Whether you are looking for a weekend getaway from Mexico City, Monterrey or Guadalajara, or a two-week road trip through the southeast, here you will find all the information you need for your next adventure.'
    : 'Ya sea que busques una escapada de fin de semana desde la Ciudad de México, Monterrey o Guadalajara, o un road trip de dos semanas por el sureste, aquí encontrarás toda la información que necesitas para tu próxima aventura.';

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Rutas en MX',
              url: 'https://rutasenmx.com',
              description: 'Planea rutas por México, descubre Pueblos Mágicos, museos, zonas arqueológicas y escapadas por carretera.',
              potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: 'https://rutasenmx.com/buscar?q={search_term_string}' },
                'query-input': 'required name=search_term_string',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Rutas en MX',
              url: 'https://rutasenmx.com',
              logo: 'https://rutasenmx.com/icon-512.png',
            },
          ]),
        }}
      />

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            {t.hero.subtitle}
          </p>
          <HeroSearch />
          <div className="mt-6">
            <Link href="/explorar" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 underline decoration-white/40 underline-offset-4 transition hover:text-white hover:decoration-white/80">
              {t.hero.exploreMap} <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(({ label, href, emoji }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              >
                <span aria-hidden="true">{emoji}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED ROUTES */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.sections.featuredRoutes}</h2>
              <p className="mt-2 text-slate-500">{t.sections.featuredRoutesDesc}</p>
            </div>
            <Link href="/rutas" className="hidden text-sm font-semibold text-orange-600 hover:text-orange-700 sm:inline-flex">
              {t.common.viewAll} &rarr;
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED_ROUTES.map((route) => (
              <Link
                key={route.slug}
                href={`/rutas/${route.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="flex h-full items-center justify-center text-4xl opacity-40">{'\uD83D\uDEE3\uFE0F'}</div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-orange-600">{route.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">{route.description}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs font-medium text-slate-400">
                    <span>{route.distance}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <span>{route.duration}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <span>{route.stops} {stopsLabel}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/rutas" className="text-sm font-semibold text-orange-600 hover:text-orange-700">{t.common.viewAll} &rarr;</Link>
          </div>
        </div>
      </section>

      {/* PUEBLOS MAGICOS */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.sections.pueblosMagicos}</h2>
              <p className="mt-2 text-slate-500">{t.sections.pueblosMagicosDesc}</p>
            </div>
            <Link href="/pueblos-magicos" className="hidden text-sm font-semibold text-orange-600 hover:text-orange-700 sm:inline-flex">
              {t.common.viewAll} &rarr;
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_PUEBLOS.map((pueblo) => (
              <Link
                key={pueblo.slug}
                href={`/lugares/${pueblo.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[3/2] bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="flex h-full items-center justify-center text-4xl opacity-40">{'\u2728'}</div>
                  <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-amber-500/90 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                    {t.place.puebloMagico}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-orange-600">{pueblo.name}</h3>
                  <p className="mt-0.5 text-sm font-medium text-orange-600/70">{pueblo.state}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{pueblo.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/pueblos-magicos" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
              {t.common.viewAll} &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.sections.howItWorks}</h2>
            <p className="mt-2 text-slate-500">{t.sections.howItWorksDesc}</p>
          </div>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, description, icon }) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">{icon}</div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-orange-600">{stepLabel} {step}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLORE BY STATE */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.sections.exploreByState}</h2>
            <p className="mt-2 text-slate-500">{t.sections.exploreByStateDesc}</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {STATES.map((state) => (
              <Link
                key={state}
                href={`/estados/${slugify(state)}`}
                className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              >
                {state}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AUTOPILOT CTA */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 sm:py-24">
        <div aria-hidden="true" className="absolute -top-24 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">{comingSoonLabel}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{t.sections.aiCta}</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            {t.sections.aiCtaDesc}
          </p>
          <div className="mt-8">
            <Link href="/planear" className="inline-flex items-center justify-center rounded-full bg-orange-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700">
              {tryNowLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* SEO CONTENT */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <article className="prose prose-slate mx-auto prose-headings:font-bold prose-a:text-orange-600">
            <h2>{seoTitle}</h2>
            <p>{seoP1}</p>
            <p>{seoP2}</p>
            <p>{seoP3}</p>
          </article>
        </div>
      </section>
    </>
  );
}
