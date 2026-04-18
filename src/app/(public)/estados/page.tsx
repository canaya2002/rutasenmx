import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildCollectionPageSchema, buildItemListSchema, buildGraph, buildWebPageSchema } from '@/lib/seo/schema';
import { mockStates, mockPlaces } from '@/lib/data/mock';
import { getStateHeroImage, getStateGallery } from '@/lib/data/state-images';
import { getTranslations } from '@/lib/i18n/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { DensityStaticMap } from '@/components/map/DensityStaticMap';
import { MapPin, ArrowRight, Compass } from 'lucide-react';

const PAGE_PATH = '/estados';
const PAGE_TITLE = 'Estados de México: rutas, lugares y qué hacer';
const PAGE_DESCRIPTION =
  'Explora los 32 estados de México. Encuentra Pueblos Mágicos, museos, zonas arqueológicas, rutas por carretera y las mejores experiencias de cada estado con mapas y guías editoriales.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'estados de México',
      'turismo por estado',
      'mapa de México',
      'destinos México',
      'pueblos mágicos por estado',
      'museos por estado',
      'zonas arqueológicas por estado',
    ],
  });
}

export default async function EstadosPage() {
  const t = await getTranslations();
  const breadcrumbs = buildBreadcrumbs([{ label: t.common.states, href: PAGE_PATH }]);

  // Compute per-state stats once
  const stateMeta = mockStates.map((state) => {
    const places = mockPlaces.filter((p) => p.stateSlug === state.slug);
    const hero = getStateHeroImage(state.slug);
    const gallery = getStateGallery(state.slug);
    const pueblosCount = places.filter((p) => p.category === 'pueblos-magicos').length;
    const museosCount = places.filter((p) => p.category === 'museos').length;
    const zonasCount = places.filter((p) => p.category === 'zonas-arqueologicas').length;
    return { ...state, hero, gallery, places, pueblosCount, museosCount, zonasCount };
  });

  const featured = stateMeta
    .filter((s) => s.hero && s.gallery.length >= 3 && s.places.length > 0)
    .sort((a, b) => b.places.length - a.places.length)
    .slice(0, 3);

  const featuredSlugs = new Set(featured.map((s) => s.slug));
  const rest = stateMeta.filter((s) => !featuredSlugs.has(s.slug));

  const collectionSchema = buildCollectionPageSchema(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    mockStates.map((state) => ({
      name: state.name,
      url: `https://rutasenmx.com/estados/${state.slug}`,
      image: state.image,
      description: state.description,
    })),
  );
  const itemListSchema = buildItemListSchema(
    mockStates.map((state) => ({
      name: state.name,
      url: `https://rutasenmx.com/estados/${state.slug}`,
      image: state.image,
    })),
  );
  const graph = buildGraph([
    buildWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, {
      lastReviewed: new Date().toISOString().split('T')[0],
    }),
    collectionSchema,
    itemListSchema,
    buildBreadcrumbSchema(breadcrumbs),
  ]);

  // All place coords for the hero density map
  const mapPoints = mockPlaces
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map((p) => ({ lat: p.lat, lng: p.lng }));

  return (
    <>
      <JsonLd data={graph} />

      <main className="bg-gradient-to-b from-slate-50 to-white">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-emerald-200/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_520px]">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  <Compass className="h-3 w-3" /> 32 estados
                </span>
                <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  {t.pages.estados.title}
                </h1>
                <p className="mt-5 max-w-xl text-balance text-lg leading-8 text-slate-600">
                  {t.pages.estados.description}
                </p>
                <dl className="mt-8 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Estados</dt>
                    <dd className="mt-1 text-2xl font-extrabold text-slate-900">32</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Lugares</dt>
                    <dd className="mt-1 text-2xl font-extrabold text-slate-900">
                      {mockPlaces.length.toLocaleString('es-MX')}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Verificados</dt>
                    <dd className="mt-1 text-2xl font-extrabold text-slate-900">100%</dd>
                  </div>
                </dl>
              </div>

              {/* Density map of the whole country */}
              <div className="relative">
                <div className="relative h-72 overflow-hidden rounded-[32px] border border-slate-200 shadow-xl sm:h-80">
                  <DensityStaticMap
                    points={mapPoints}
                    alt="Mapa de lugares por estado"
                    pinColor="06C167"
                    maxPoints={75}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm">
                    <MapPin className="mr-1 inline h-3 w-3 text-[#06C167]" />
                    {mockPlaces.length.toLocaleString('es-MX')} lugares en el mapa
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED STATES — wide editorial cards */}
        {featured.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Destacados
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Los estados con más para descubrir
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {featured.map((state) => (
                <Link
                  key={state.slug}
                  href={`/estados/${state.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {state.hero ? (
                      <Image
                        src={state.hero}
                        alt={t.pages.estadoDetail.photoAlt.replace('{state}', state.name)}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                        className="object-cover transition duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                        {state.abbr}
                      </p>
                      <h3 className="mt-1 text-2xl font-extrabold text-white drop-shadow-md">
                        {state.name}
                      </h3>
                    </div>
                  </div>

                  {/* Inline gallery strip */}
                  {state.gallery.length >= 3 && (
                    <div className="grid grid-cols-3 gap-1 px-1 pt-1">
                      {state.gallery.slice(1, 4).map((src, i) => (
                        <div key={src + i} className="relative aspect-square overflow-hidden rounded-md">
                          <Image
                            src={src}
                            alt=""
                            fill
                            sizes="140px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">{state.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
                      {state.pueblosCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-200">
                          {state.pueblosCount} Pueblos Mágicos
                        </span>
                      )}
                      {state.museosCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-violet-700 ring-1 ring-violet-200">
                          {state.museosCount} museos
                        </span>
                      )}
                      {state.zonasCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 ring-1 ring-amber-200">
                          {state.zonasCount} zonas
                        </span>
                      )}
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#06C167] group-hover:underline">
                      Explorar {state.name}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ALL STATES — premium list with images when available, distinctive cards when not */}
        <section
          aria-label={t.pages.estados.listLabel}
          className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8"
        >
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Todos los estados
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Los 32 estados, en un solo vistazo
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rest.map((state) => {
              const initials = state.name
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase();
              return (
                <Link
                  key={state.slug}
                  href={`/estados/${state.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
                >
                  <div className="relative aspect-[5/3] overflow-hidden">
                    {state.hero ? (
                      <Image
                        src={state.hero}
                        alt={t.pages.estadoDetail.photoAlt.replace('{state}', state.name)}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition duration-500 group-hover:scale-110"
                      />
                    ) : (
                      // Distinctive gradient card with large initials when no photo
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 via-teal-500 to-sky-600 text-white">
                        <span className="text-5xl font-black tracking-tight drop-shadow-md">
                          {initials}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm">
                      {state.abbr}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="text-lg font-bold text-white drop-shadow-md">{state.name}</h3>
                      <p className="text-[11px] font-semibold text-white/80">
                        {state.places.length} {t.pages.estados.placesCount}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                      {state.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {state.pueblosCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          {state.pueblosCount} PM
                        </span>
                      )}
                      {state.museosCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                          {state.museosCount} museos
                        </span>
                      )}
                      {state.zonasCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          {state.zonasCount} zonas
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900">{t.pages.estados.exploreByCategory}</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/pueblos-magicos"
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/pueblomagicoicon.svg" alt="" className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700">
                  {t.common.pueblosMagicos}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{t.pages.estados.discoverMagic}</p>
              </div>
            </Link>
            <Link
              href="/museos"
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/museumicon.svg" alt="" className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-violet-700">
                  {t.common.museums}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{t.pages.estados.artHistoryCulture}</p>
              </div>
            </Link>
            <Link
              href="/zonas-arqueologicas"
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-lg"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/arqueologiaicon.svg" alt="" className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-amber-700">
                  {t.common.archaeologicalZones}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{t.pages.estados.prehispanicMexico}</p>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
