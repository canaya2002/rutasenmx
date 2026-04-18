import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { SmartHeroSearch } from '@/components/home/SmartHeroSearch';
import { CategoryCarousel, type CategoryCard } from '@/components/home/CategoryCarousel';
import { StateHoverCard } from '@/components/home/StateHoverCard';
import { AutopilotLauncher } from '@/components/home/AutopilotLauncher';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { HeroVideo } from '@/components/home/HeroVideo';
import { getLocale, getTranslations } from '@/lib/i18n/server';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildFAQSchema,
  buildHowToSchema,
  buildItemListSchema,
  buildGraph,
} from '@/lib/seo/schema';
import { ESTADOS_MEXICO } from '@/lib/constants';
import { STATE_IMAGES } from '@/lib/data/state-images';

export const metadata: Metadata = {
  title: 'Rutas en MX — Planea rutas por México, Pueblos Mágicos y escapadas',
  description:
    'Plataforma editorial e inteligente para planear viajes por carretera en México. Más de 200 guías editoriales, 100+ rutas curadas, Pueblos Mágicos, zonas arqueológicas, museos, gastronomía y mapas interactivos.',
  alternates: {
    canonical: 'https://rutasenmx.com',
    languages: {
      'es-MX': 'https://rutasenmx.com',
      'en-US': 'https://rutasenmx.com',
      'x-default': 'https://rutasenmx.com',
    },
    types: {
      'application/rss+xml': 'https://rutasenmx.com/guias/rss.xml',
    },
  },
};

/* ------------------------------------------------------------------ */
/*  CATEGORY DATA (big cards, no emojis)                              */
/* ------------------------------------------------------------------ */

const CATEGORIES_ES: CategoryCard[] = [
  { label: 'Pueblos Mágicos', href: '/pueblos-magicos', image: '/Zacatecas/IglesiaDelCentro.jpg', iconSvg: '/icon/pueblomagicoicon.svg', color: '#06C167' },
  { label: 'Museos', href: '/museos', image: '/CiudadDeMexico/PalacioBellasArtes.jpg', iconSvg: '/icon/museumicon.svg', color: '#8B5CF6' },
  { label: 'Zonas arqueológicas', href: '/zonas-arqueologicas', image: '/Yucatan/Piramide.jpg', iconSvg: '/icon/arqueologiaicon.svg', color: '#D97706' },
  { label: 'Playas', href: '/lugares?tipo=playas', image: '/QuintanaRoo/Playa.jpg', iconSvg: '/icon/playaicon.svg', color: '#0EA5E9' },
  { label: 'Cenotes', href: '/lugares?tipo=cenotes', image: '/Yucatan/Cenote.jpg', iconSvg: '/icon/cenoteicon.svg', color: '#06B6D4' },
  { label: 'Centros históricos', href: '/lugares?tipo=centros-historicos', image: '/Oaxaca/CallesDeOaxaca.jpg', iconSvg: '/icon/CentroHistoricoicon.svg', color: '#DC2626' },
  { label: 'Haciendas', href: '/lugares?tipo=haciendas', image: '/Jalisco/TequilaPlanta.jpg', iconSvg: '/icon/Haciendaicon.svg', color: '#E11D48' },
  { label: 'Sitios INAH', href: '/lugares?tipo=sitios-inah', image: '/Chiapas/Piramide.jpg', iconSvg: '/icon/INAHicon.svg', color: '#B45309' },
  { label: 'Rutas', href: '/rutas', image: '/NuevoLeon/Paisaje.jpg', color: '#7C3AED' },
  { label: 'Cascadas', href: '/lugares?tipo=cascadas', image: '/Chiapas/Cascada.jpg', color: '#3B82F6' },
];

const CATEGORIES_EN: CategoryCard[] = [
  { label: 'Pueblos Mágicos', href: '/pueblos-magicos', image: '/Zacatecas/IglesiaDelCentro.jpg', iconSvg: '/icon/pueblomagicoicon.svg' },
  { label: 'Museums', href: '/museos', image: '/CiudadDeMexico/PalacioBellasArtes.jpg', iconSvg: '/icon/museumicon.svg' },
  { label: 'Archaeological zones', href: '/zonas-arqueologicas', image: '/Yucatan/Piramide.jpg', iconSvg: '/icon/arqueologiaicon.svg' },
  { label: 'Beaches', href: '/lugares?tipo=playas', image: '/QuintanaRoo/Playa.jpg', iconSvg: '/icon/playaicon.svg' },
  { label: 'Cenotes', href: '/lugares?tipo=cenotes', image: '/Yucatan/Cenote.jpg', iconSvg: '/icon/cenoteicon.svg' },
  { label: 'Historic centers', href: '/lugares?tipo=centros-historicos', image: '/Oaxaca/CallesDeOaxaca.jpg', iconSvg: '/icon/CentroHistoricoicon.svg' },
  { label: 'Haciendas', href: '/lugares?tipo=haciendas', image: '/Jalisco/TequilaPlanta.jpg', iconSvg: '/icon/Haciendaicon.svg' },
  { label: 'INAH sites', href: '/lugares?tipo=sitios-inah', image: '/Chiapas/Piramide.jpg', iconSvg: '/icon/INAHicon.svg' },
  { label: 'Routes', href: '/rutas', image: '/NuevoLeon/Paisaje.jpg' },
  { label: 'Waterfalls', href: '/lugares?tipo=cascadas', image: '/Chiapas/Cascada.jpg' },
];

/* ------------------------------------------------------------------ */
/*  FEATURED ROUTES DATA                                              */
/* ------------------------------------------------------------------ */

const FEATURED_ROUTES_ES = [
  { slug: 'cdmx-a-oaxaca-por-puebla', title: 'CDMX a Oaxaca', description: 'De la capital al corazón mezcalero pasando por Puebla y la Mixteca.', distance: '460 km', duration: '3 días', stops: 8, image: '/Oaxaca/CallesDeOaxaca.jpg' },
  { slug: 'ruta-maya-yucatan', title: 'Ruta Yucatán', description: 'Cenotes, zonas arqueológicas mayas y playas caribeñas.', distance: '680 km', duration: '5 días', stops: 12, image: '/Yucatan/Piramides.jpg' },
  { slug: 'valle-de-guadalupe-ensenada', title: 'Ruta del Vino', description: 'Valle de Guadalupe, Ensenada y la costa del Pacífico bajacaliforniano.', distance: '320 km', duration: '2 días', stops: 6, image: '/BajaCalifornia/Mar.jpg' },
  { slug: 'chiapas-arqueologia-naturaleza', title: 'Ruta Chiapas', description: 'Selva lacandona, cascadas de Agua Azul, Palenque y San Cristóbal.', distance: '540 km', duration: '4 días', stops: 10, image: '/Chiapas/Piramide.jpg' },
] as const;

const FEATURED_ROUTES_EN = [
  { slug: 'cdmx-a-oaxaca-por-puebla', title: 'Mexico City to Oaxaca', description: 'From the capital to the heart of mezcal country through Puebla and the Mixteca.', distance: '460 km', duration: '3 days', stops: 8, image: '/Oaxaca/CallesDeOaxaca.jpg' },
  { slug: 'ruta-maya-yucatan', title: 'Yucatán Route', description: 'Cenotes, Mayan archaeological sites and Caribbean beaches.', distance: '680 km', duration: '5 days', stops: 12, image: '/Yucatan/Piramides.jpg' },
  { slug: 'valle-de-guadalupe-ensenada', title: 'Wine Route', description: 'Valle de Guadalupe, Ensenada and the Baja California Pacific coast.', distance: '320 km', duration: '2 days', stops: 6, image: '/BajaCalifornia/Mar.jpg' },
  { slug: 'chiapas-arqueologia-naturaleza', title: 'Chiapas Route', description: 'Lacandon jungle, Agua Azul waterfalls, Palenque and San Cristóbal.', distance: '540 km', duration: '4 days', stops: 10, image: '/Chiapas/Piramide.jpg' },
] as const;

/* ------------------------------------------------------------------ */
/*  PUEBLOS MAGICOS DATA                                              */
/* ------------------------------------------------------------------ */

const FEATURED_PUEBLOS_ES = [
  { slug: 'real-de-catorce', name: 'Real de Catorce', state: 'San Luis Potosí', description: 'Pueblo fantasma en la sierra con historia minera y misticismo huichol.', image: null as string | null },
  { slug: 'bacalar', name: 'Bacalar', state: 'Quintana Roo', description: 'La laguna de los siete colores rodeada de naturaleza y tranquilidad.', image: '/QuintanaRoo/Playa.jpg' },
  { slug: 'taxco', name: 'Taxco', state: 'Guerrero', description: 'Capital de la plata con calles empedradas y arquitectura barroca.', image: null as string | null },
  { slug: 'san-cristobal-de-las-casas', name: 'San Cristóbal de las Casas', state: 'Chiapas', description: 'Ciudad colonial en los Altos de Chiapas con mercados y cultura tzotzil.', image: '/Chiapas/Iglesia.jpg' },
  { slug: 'patzcuaro', name: 'Pátzcuaro', state: 'Michoacán', description: 'Lago, islas y la tradición purépecha del Día de Muertos.', image: '/Michoacan/Pueblo.jpg' },
  { slug: 'tepoztlan', name: 'Tepoztlán', state: 'Morelos', description: 'Cerros místicos, mercado artesanal y el Tepozteco prehispánico.', image: '/Morelos/Iglesia.jpg' },
] as const;

const FEATURED_PUEBLOS_EN = [
  { slug: 'real-de-catorce', name: 'Real de Catorce', state: 'San Luis Potosí', description: 'Ghost town in the mountains with mining history and Huichol mysticism.', image: null as string | null },
  { slug: 'bacalar', name: 'Bacalar', state: 'Quintana Roo', description: 'The lagoon of seven colors surrounded by nature and tranquility.', image: '/QuintanaRoo/Playa.jpg' },
  { slug: 'taxco', name: 'Taxco', state: 'Guerrero', description: 'Silver capital with cobblestone streets and baroque architecture.', image: null as string | null },
  { slug: 'san-cristobal-de-las-casas', name: 'San Cristóbal de las Casas', state: 'Chiapas', description: 'Colonial city in the Chiapas highlands with markets and Tzotzil culture.', image: '/Chiapas/Iglesia.jpg' },
  { slug: 'patzcuaro', name: 'Pátzcuaro', state: 'Michoacán', description: 'Lake, islands and the Purépecha tradition of Day of the Dead.', image: '/Michoacan/Pueblo.jpg' },
  { slug: 'tepoztlan', name: 'Tepoztlán', state: 'Morelos', description: 'Mystical hills, artisan market and the pre-Hispanic Tepozteco.', image: '/Morelos/Iglesia.jpg' },
] as const;

/* ------------------------------------------------------------------ */
/*  ROAD-TRIP COLLAGE                                                 */
/* ------------------------------------------------------------------ */

const ROAD_TRIP_COLLAGE = [
  { src: '/Oaxaca/ImagenAestheticOaxaca.jpg', alt: 'Calles coloridas de Oaxaca', caption: 'Oaxaca' },
  { src: '/Yucatan/Cenote.jpg',              alt: 'Cenote en Yucatán',         caption: 'Yucatán' },
  { src: '/Jalisco/Festival.jpg',            alt: 'Festival en Jalisco',       caption: 'Jalisco' },
  { src: '/BajaCalifornia/Mar.jpg',          alt: 'Costa de Baja California',  caption: 'Baja California' },
  { src: '/Chiapas/Cascada.jpg',             alt: 'Cascada en Chiapas',        caption: 'Chiapas' },
  { src: '/NuevoLeon/CerroDeLaSilla.jpg',    alt: 'Cerro de la Silla',         caption: 'Nuevo León' },
];

/* ================================================================== */
/*  PAGE COMPONENT                                                    */
/* ================================================================== */

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const isEn = locale === 'en';

  const CATEGORIES = isEn ? CATEGORIES_EN : CATEGORIES_ES;
  const FEATURED_ROUTES = isEn ? FEATURED_ROUTES_EN : FEATURED_ROUTES_ES;
  const FEATURED_PUEBLOS = isEn ? FEATURED_PUEBLOS_EN : FEATURED_PUEBLOS_ES;

  const stopsLabel = isEn ? 'stops' : 'paradas';
  const stepLabel = isEn ? 'Step' : 'Paso';
  const tryNowLabel = isEn ? 'Try Autopilot now' : 'Probar Autopilot';
  const exploreCategoriesLabel = isEn ? 'Browse by category' : 'Explora por categoría';
  const exploreCategoriesDesc = isEn
    ? 'Pick a theme and start building your trip.'
    : 'Elige un tema y comienza a armar tu viaje.';
  const roadTripHeadline = isEn
    ? 'Road trips through Mexico'
    : 'Viajes por carretera en México';
  const roadTripIntro = isEn ? (
    <>
      Mexico is an ideal country to explore by road. From the <strong>Pacific coast</strong> to
      the <strong>Yucatán peninsula</strong>, every kilometer reveals unique landscapes,
      flavors and living culture. <strong>Rutas en MX</strong> helps you weave together{' '}
      <Link href="/pueblos-magicos" className="text-[#06C167] hover:underline">Pueblos Mágicos</Link>,{' '}
      <Link href="/zonas-arqueologicas" className="text-[#06C167] hover:underline">archaeological zones</Link>,{' '}
      <Link href="/museos" className="text-[#06C167] hover:underline">museums</Link>,
      haciendas, cenotes and natural parks into one memorable itinerary.
    </>
  ) : (
    <>
      México es un país ideal para recorrer por carretera. Desde las <strong>costas del Pacífico</strong>{' '}
      hasta la <strong>península de Yucatán</strong>, cada kilómetro ofrece paisajes, sabores y cultura
      únicos. <strong>Rutas en MX</strong> te ayuda a entrelazar{' '}
      <Link href="/pueblos-magicos" className="text-[#06C167] hover:underline">Pueblos Mágicos</Link>,{' '}
      <Link href="/zonas-arqueologicas" className="text-[#06C167] hover:underline">zonas arqueológicas</Link>,{' '}
      <Link href="/museos" className="text-[#06C167] hover:underline">museos</Link>,
      haciendas, cenotes y parques naturales en un solo itinerario memorable.
    </>
  );
  const roadTripDetails = isEn
    ? [
        { title: 'Interactive map', desc: 'Every stop, plotted. Drag, filter and export.', href: '/explorar' },
        { title: 'Smart tolls & fuel', desc: 'Automatic toll and fuel estimates for every vehicle.', href: '/planear' },
        { title: 'Editorial guides', desc: '200+ hand-picked stories by state, Pueblo Mágico and ruta.', href: '/guias' },
        { title: 'Offline mode', desc: 'Take your itinerary off the grid (Premium).', href: '/precios' },
      ]
    : [
        { title: 'Mapa interactivo', desc: 'Cada parada en el mapa. Arrastra, filtra y exporta.', href: '/explorar' },
        { title: 'Casetas y gasolina', desc: 'Estimaciones automáticas de peaje y combustible por vehículo.', href: '/planear' },
        { title: 'Guías editoriales', desc: '+200 historias curadas por estado, pueblo mágico y ruta.', href: '/guias' },
        { title: 'Modo sin conexión', desc: 'Lleva tu itinerario fuera de línea (Premium).', href: '/precios' },
      ];

  const statesWithPlaces = ESTADOS_MEXICO.map((estado) => {
    const images = STATE_IMAGES[estado.slug];
    return {
      name: estado.name,
      slug: estado.slug,
      image: images?.hero ?? null,
      collage: images?.gallery ?? [],
    };
  });

  const HOW_IT_WORKS = [
    { step: 1, title: t.howItWorks.step1Title, description: t.howItWorks.step1Desc, icon: '\uD83D\uDCCD' },
    { step: 2, title: t.howItWorks.step2Title, description: t.howItWorks.step2Desc, icon: '\uD83D\uDDFA\uFE0F' },
    { step: 3, title: t.howItWorks.step3Title, description: t.howItWorks.step3Desc, icon: '\uD83D\uDCCB' },
  ];

  const homeFAQ = buildFAQSchema([
    {
      question: isEn
        ? 'How do I plan a road trip across Mexico?'
        : '¿Cómo planeo un viaje por carretera en México?',
      answer: isEn
        ? 'Pick an origin and destination, choose stops from our catalog of Pueblos Mágicos, museums and archaeological zones, and let the planner estimate distances, tolls and fuel. You can also use our AI Autopilot to generate a full itinerary.'
        : 'Elige un origen y un destino, selecciona paradas de nuestro catálogo de Pueblos Mágicos, museos y zonas arqueológicas, y deja que el planificador estime distancias, casetas y combustible. También puedes usar nuestro Autopilot con IA para generar un itinerario completo.',
    },
    {
      question: isEn ? 'How many Pueblos Mágicos are there in Mexico?' : '¿Cuántos Pueblos Mágicos hay en México?',
      answer: isEn
        ? 'The SECTUR program currently recognizes over 177 Pueblos Mágicos across all 32 states. You can explore them all on our Pueblos Mágicos page.'
        : 'El programa de SECTUR reconoce actualmente más de 177 Pueblos Mágicos en los 32 estados. Puedes explorarlos todos en nuestra página de Pueblos Mágicos.',
    },
    {
      question: isEn ? 'Is Rutas en MX free to use?' : '¿Rutas en MX es gratis?',
      answer: isEn
        ? 'Yes, the free plan lets you explore all content, save 1 trip and use the interactive map. Paid plans unlock more saved trips, more stops, PDF/GPX export, ad-free mode, AI Autopilot and offline mode.'
        : 'Sí, el plan gratuito te permite explorar todo el contenido, guardar 1 viaje y usar el mapa interactivo. Los planes de pago desbloquean más viajes guardados, más paradas, exportación PDF/GPX, modo sin anuncios, Autopilot con IA y modo offline.',
    },
    {
      question: isEn ? 'Can I export my itinerary?' : '¿Puedo exportar mi itinerario?',
      answer: isEn
        ? 'Yes. On paid plans you can export your itinerary as PDF for printing, GPX for GPS devices, or share a link with friends.'
        : 'Sí. En los planes de pago puedes exportar tu itinerario en PDF para imprimir, GPX para dispositivos GPS, o compartir un enlace con amigos.',
    },
    {
      question: isEn ? 'What information do you use to build your routes?' : '¿Con qué información arman sus rutas?',
      answer: isEn
        ? 'We combine official open data (SECTUR, INAH, SIC Cultura, INEGI) with our editorial curation. See our methodology page for details.'
        : 'Combinamos datos abiertos oficiales (SECTUR, INAH, SIC Cultura, INEGI) con nuestra curaduría editorial. Consulta nuestra página de metodología para más detalles.',
    },
  ]);

  const homeHowTo = buildHowToSchema(
    isEn ? 'How to plan a road trip through Mexico with Rutas en MX' : 'Cómo planear un viaje por carretera en México con Rutas en MX',
    isEn
      ? 'Step-by-step guide to design a full Mexico road trip: origin, stops, itinerary and export.'
      : 'Guía paso a paso para diseñar un viaje por carretera en México: origen, paradas, itinerario y exportación.',
    [
      { name: isEn ? 'Choose origin and destination' : 'Elige origen y destino', text: isEn ? 'Enter where you start and where you want to go. Our planner suggests the best driving route.' : 'Ingresa de dónde sales y a dónde quieres llegar. Nuestro planificador sugiere la mejor ruta.' },
      { name: isEn ? 'Add stops along the way' : 'Añade paradas en el camino', text: isEn ? 'Browse Pueblos Mágicos, museums, archaeological zones and natural parks. Add the ones you want to visit.' : 'Explora Pueblos Mágicos, museos, zonas arqueológicas y parques naturales. Agrega los que quieras visitar.' },
      { name: isEn ? 'Review distances and costs' : 'Revisa distancias y costos', text: isEn ? 'The planner estimates total distance, driving time, toll costs and fuel.' : 'El planificador estima distancia total, tiempo de manejo, costos de casetas y combustible.' },
      { name: isEn ? 'Export or share' : 'Exporta o comparte', text: isEn ? 'Download your itinerary as PDF or GPX, or share a link with your travel companions.' : 'Descarga tu itinerario en PDF o GPX, o comparte un enlace con tus compañeros de viaje.' },
    ],
    'PT15M',
  );

  const featuredRoutesList = buildItemListSchema(
    FEATURED_ROUTES.map((r) => ({
      name: r.title,
      url: `https://rutasenmx.com/rutas/${r.slug}`,
      description: r.description,
      image: `https://rutasenmx.com${r.image}`,
    })),
  );

  const featuredPueblosList = buildItemListSchema(
    FEATURED_PUEBLOS.map((p) => ({
      name: p.name,
      url: `https://rutasenmx.com/lugares/${p.slug}`,
      description: p.description,
      ...(p.image ? { image: `https://rutasenmx.com${p.image}` } : {}),
    })),
  );

  const homeGraph = buildGraph([homeFAQ, homeHowTo, featuredRoutesList, featuredPueblosList]);

  return (
    <>
      <JsonLd data={homeGraph} />

      {/* ============================================================ */}
      {/* HERO — cinematic 4K video with 3D search                     */}
      {/* ============================================================ */}
      <section className="relative isolate overflow-hidden bg-black">
        {/* Background video (poster paints instantly, video fades in).
            Overscans the section by 2 px on every side so subpixel rounding
            can never reveal the white section below. */}
        <div className="absolute -inset-[2px] -z-20">
          <HeroVideo
            src="/videos/VideoLandingMexico.mp4"
            poster="/Yucatan/Piramide.jpg"
          />
        </div>
        {/* Subtle gradient — darker only at the top/bottom edges for text legibility,
            but keeps the middle of the video clear. No white fade-out. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/20 to-black/45" />
        {/* Glow blobs */}
        <div aria-hidden className="pointer-events-none absolute -left-20 top-1/4 -z-[5] h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 -z-[5] h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#06C167]" />
            {isEn ? 'Made in Mexico · 32 states · 2,000+ places' : 'Hecho en México · 32 estados · +2,000 lugares'}
          </span>
          <h1 className="animate-fade-up mt-5 max-w-4xl text-balance text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl xl:text-7xl">
            {t.hero.title}
          </h1>
          <p className="animate-fade-up mx-auto mt-5 max-w-2xl text-balance text-lg leading-relaxed text-white/90 sm:text-xl">
            {t.hero.subtitle}
          </p>

          <SmartHeroSearch />

          <Link
            href="/explorar"
            className="animate-fade-up mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/85 underline decoration-white/30 underline-offset-4 transition hover:text-white hover:decoration-white/80"
          >
            {t.hero.exploreMap} <span aria-hidden="true">→</span>
          </Link>
        </div>

      </section>

      {/* ============================================================ */}
      {/* CATEGORY CAROUSEL — big cards, SVG icons, no emojis          */}
      {/* ============================================================ */}
      <ScrollReveal as="section" className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {exploreCategoriesLabel}
              </h2>
              <p className="mt-2 text-slate-500">{exploreCategoriesDesc}</p>
            </div>
          </div>
          <CategoryCarousel items={CATEGORIES} ariaLabel={exploreCategoriesLabel} />
        </div>
      </ScrollReveal>

      {/* ============================================================ */}
      {/* FEATURED ROUTES                                              */}
      {/* ============================================================ */}
      <ScrollReveal as="section" className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {t.sections.featuredRoutes}
              </h2>
              <p className="mt-2 text-slate-500">{t.sections.featuredRoutesDesc}</p>
            </div>
            <Link href="/rutas" className="hidden text-sm font-semibold text-[#06C167] hover:text-emerald-700 sm:inline-flex">
              {t.common.viewAll} →
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED_ROUTES.map((route, i) => (
              <Link
                key={route.slug}
                href={`/rutas/${route.slug}`}
                className={`reveal-stagger-${Math.min(5, i + 1)} group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={route.image}
                    alt={route.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-slate-800 backdrop-blur-sm">
                    {route.distance}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-[#06C167]">{route.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">{route.description}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs font-medium text-slate-400">
                    <span>{route.duration}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <span>{route.stops} {stopsLabel}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ============================================================ */}
      {/* PUEBLOS MAGICOS                                              */}
      {/* ============================================================ */}
      <ScrollReveal as="section" className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {t.sections.pueblosMagicos}
              </h2>
              <p className="mt-2 text-slate-500">{t.sections.pueblosMagicosDesc}</p>
            </div>
            <Link href="/pueblos-magicos" className="hidden text-sm font-semibold text-[#06C167] hover:text-emerald-700 sm:inline-flex">
              {t.common.viewAll} →
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_PUEBLOS.map((pueblo) => (
              <Link
                key={pueblo.slug}
                href={`/lugares/${pueblo.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  {pueblo.image ? (
                    <Image
                      src={pueblo.image}
                      alt={pueblo.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-emerald-100 via-slate-100 to-emerald-50" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#06C167]/95 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon/pueblomagicoicon.svg" alt="" className="h-3.5 w-3.5 brightness-0 invert" aria-hidden />
                    {t.place.puebloMagico}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-[#06C167]">{pueblo.name}</h3>
                  <p className="mt-0.5 text-sm font-medium text-[#06C167]/70">{pueblo.state}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{pueblo.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ============================================================ */}
      {/* HOW IT WORKS                                                 */}
      {/* ============================================================ */}
      <ScrollReveal as="section" className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t.sections.howItWorks}
            </h2>
            <p className="mt-2 text-slate-500">{t.sections.howItWorksDesc}</p>
          </div>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, description, icon }, i) => (
              <div key={step} className={`reveal-stagger-${i + 1} text-center`}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl shadow-sm ring-1 ring-emerald-100">
                  {icon}
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#06C167]">
                  {stepLabel} {step}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ============================================================ */}
      {/* ALL 32 STATES — hover collage                                */}
      {/* ============================================================ */}
      <ScrollReveal as="section" className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t.sections.exploreByState}
            </h2>
            <p className="mt-2 text-slate-500">{t.sections.exploreByStateDesc}</p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {statesWithPlaces.map((state) => (
              <StateHoverCard
                key={state.slug}
                name={state.name}
                slug={state.slug}
                image={state.image}
                collage={state.collage}
              />
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ============================================================ */}
      {/* AUTOPILOT CTA — live (no "próximamente")                      */}
      {/* ============================================================ */}
      <section className="relative isolate overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <div className="animate-ken-burns absolute inset-0">
            <Image src="/NuevoLeon/Paisaje.jpg" alt="" fill sizes="100vw" className="object-cover" />
          </div>
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black/85 via-black/70 to-black/85" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-[5] h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/15 blur-3xl" />

        <ScrollReveal className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {isEn ? 'AI Autopilot · Live' : 'Autopilot con IA · Disponible'}
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t.sections.aiCta}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg leading-relaxed text-slate-200">
            {t.sections.aiCtaDesc}
          </p>
          <div className="mt-8">
            <AutopilotLauncher label={tryNowLabel} />
          </div>
        </ScrollReveal>
      </section>

      {/* ============================================================ */}
      {/* ROAD TRIPS — SEO text + interactive collage                  */}
      {/* ============================================================ */}
      <ScrollReveal as="section" className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-12">
            {/* Text column */}
            <article className="prose prose-slate max-w-none lg:col-span-7 prose-headings:font-bold prose-a:text-[#06C167] prose-a:no-underline hover:prose-a:underline">
              <span className="mb-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#06C167] ring-1 ring-emerald-100">
                {isEn ? 'Why drive Mexico' : 'Por qué recorrer México'}
              </span>
              <h2 className="mt-2">{roadTripHeadline}</h2>
              <p>{roadTripIntro}</p>

              <ul className="not-prose mt-6 grid gap-3 sm:grid-cols-2">
                {roadTripDetails.map((item, i) => (
                  <li key={item.title} className={`reveal-stagger-${(i % 4) + 1}`}>
                    <Link
                      href={item.href}
                      className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                    >
                      <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                      <span className="mt-1 block text-sm text-slate-500">{item.desc}</span>
                      <span className="mt-2 block text-xs font-semibold text-[#06C167]">
                        {isEn ? 'Learn more →' : 'Saber más →'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-6">
                {isEn
                  ? 'Whether you want a weekend escape from Mexico City, Monterrey or Guadalajara, or a two-week road trip through the southeast — every stop on our site is geo-located and clickable, so you can jump straight into your favourite maps app.'
                  : 'Ya sea una escapada de fin de semana desde la Ciudad de México, Monterrey o Guadalajara, o un road trip de dos semanas por el sureste — cada parada del sitio está geolocalizada y se abre en tu aplicación de mapas favorita.'}
              </p>
            </article>

            {/* Interactive collage — explicit row heights so tiles never render as thin strips */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-6 gap-3 auto-rows-[140px] sm:auto-rows-[170px] lg:auto-rows-[150px] xl:auto-rows-[180px]">
                {ROAD_TRIP_COLLAGE.slice(0, 6).map((img, i) => {
                  const placements = [
                    'col-span-6 row-span-2', // hero (full width, 2 rows tall)
                    'col-span-3 row-span-2',
                    'col-span-3 row-span-2',
                    'col-span-2 row-span-2',
                    'col-span-2 row-span-2',
                    'col-span-2 row-span-2',
                  ];
                  return (
                    <div
                      key={img.src}
                      className={`group relative overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 ${placements[i]} reveal-stagger-${(i % 5) + 1}`}
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 40vw"
                        className="object-cover transition duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 text-sm font-semibold text-white drop-shadow-md">
                        {img.caption}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </>
  );
}
