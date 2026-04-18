import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { PageShell } from '@/components/layout/PageShell';
import { pickDecoration, pickDecorations } from '@/lib/data/general-images';
import { mockCollections, getPlaceBySlug } from '@/lib/data/mock';
import {
  buildCollectionPageSchema,
  buildItemListSchema,
  buildGraph,
  buildWebPageSchema,
} from '@/lib/seo/schema';
import { Sparkles, MapPin, Tag, Calendar } from 'lucide-react';

const PAGE_PATH = '/colecciones';
const PAGE_TITLE = 'Colecciones curadas de destinos | Rutas en MX';
const PAGE_DESCRIPTION =
  'Colecciones editoriales: escapadas desde CDMX, pueblos mágicos imperdibles, patrimonio UNESCO, cenotes de Yucatán y más. Cada colección es un viaje listo para inspirarte o imprimirlo tal cual.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    keywords: [
      'colecciones viajes México',
      'rutas curadas México',
      'escapadas fin de semana',
      'pueblos mágicos imperdibles',
      'patrimonio UNESCO México',
      'itinerarios por tema',
    ],
  });
}

// Tag each collection with a category + tint for visual differentiation.
const COLLECTION_META: Record<string, { tag: string; tint: string; gradient: string }> = {
  'escapadas-fin-de-semana-cdmx':  { tag: 'Escapadas',     tint: 'from-emerald-500 to-teal-600',     gradient: 'from-emerald-900/70 to-transparent' },
  'playas-poco-conocidas':         { tag: 'Costas',        tint: 'from-sky-500 to-cyan-600',         gradient: 'from-sky-900/75 to-transparent' },
  'patrimonio-unesco-mexico':      { tag: 'UNESCO',        tint: 'from-amber-500 to-orange-600',     gradient: 'from-amber-900/75 to-transparent' },
  'mexico-para-foodies':           { tag: 'Gastronomía',   tint: 'from-rose-500 to-red-600',         gradient: 'from-rose-900/75 to-transparent' },
  'aventura-y-naturaleza':         { tag: 'Naturaleza',    tint: 'from-green-500 to-emerald-600',    gradient: 'from-green-900/75 to-transparent' },
};

function computeCollectionStats(placeSlugs: string[]) {
  const places = placeSlugs.map(getPlaceBySlug).filter(Boolean);
  const states = new Set(places.map((p) => p!.stateName));
  return {
    placeCount: places.length,
    stateCount: states.size,
    states: Array.from(states).slice(0, 3),
  };
}

export default function ColeccionesPage() {  const mosaic = pickDecorations('colecciones-mosaic', 6);

  const collectionsEnriched = mockCollections.map((c, i) => {
    const cover = pickDecoration(`coleccion-cover-${c.slug}`);
    const stats = computeCollectionStats(c.placeSlugs);
    const meta = COLLECTION_META[c.slug] ?? { tag: 'Destacado', tint: 'from-slate-700 to-slate-900', gradient: 'from-slate-900/75 to-transparent' };
    return { ...c, cover, stats, meta, isFeatured: i === 0 };
  });

  const featured = collectionsEnriched[0];
  const rest = collectionsEnriched.slice(1);

  const collectionSchema = buildCollectionPageSchema(
    PAGE_TITLE,
    PAGE_DESCRIPTION,
    mockCollections.map((c) => ({
      name: c.name,
      url: `https://rutasenmx.com/colecciones/${c.slug}`,
      image: c.image,
      description: c.description,
    })),
  );
  const itemList = buildItemListSchema(
    mockCollections.map((c) => ({
      name: c.name,
      url: `https://rutasenmx.com/colecciones/${c.slug}`,
      description: c.description,
    })),
  );
  const graph = buildGraph([
    buildWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, {
      lastReviewed: new Date().toISOString().split('T')[0],
    }),
    collectionSchema,
    itemList,
  ]);

  return (
    <>
      <JsonLd data={graph} />
      <PageShell
        title="Colecciones curadas"
        kicker="Empresa · Editorial"
        summary="Viajes listos para copiar y pegar. Cada colección agrupa lugares por tema, región o estilo — con paradas verificadas, estadísticas y mapa."
        decorKey="colecciones"
        current="colecciones"
        accent="rose"
        stats={[
          { value: String(mockCollections.length), label: 'Colecciones' },
          { value: String(mockCollections.reduce((a, c) => a + c.placeSlugs.length, 0)), label: 'Destinos curados' },
          { value: '32', label: 'Estados' },
          { value: 'Editorial', label: 'Curaduría' },
        ]}
      >
        {/* Featured hero collection */}
        {featured && (
          <section className="mb-14">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
              Destacado esta semana
            </p>
            <Link
              href={`/colecciones/${featured.slug}`}
              className="group relative block overflow-hidden rounded-[32px] border border-slate-200 shadow-xl"
            >
              <div className="relative aspect-[16/9] sm:aspect-[21/9]">
                {featured.cover ? (
                  <Image
                    src={featured.cover}
                    alt={featured.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 900px"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className={`h-full w-full bg-gradient-to-br ${featured.meta.tint}`} />
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${featured.meta.gradient}`} />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-700 shadow-md">
                    <Sparkles className="h-3 w-3" />
                    {featured.meta.tag}
                  </span>
                  <h2 className="mt-4 max-w-3xl text-balance text-3xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
                    {featured.name}
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
                    {featured.description}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold text-white">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
                      <MapPin className="h-3 w-3" /> {featured.stats.placeCount} destinos
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
                      <Tag className="h-3 w-3" /> {featured.stats.stateCount} estados
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
                      <Calendar className="h-3 w-3" /> Curada por {featured.curatedBy}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Mosaic strip — 3 cols mobile, 6 cols desktop so tiles never become slivers */}
        {mosaic.length >= 6 && (
          <section className="mb-14">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
              {mosaic.slice(0, 6).map((src, i) => (
                <div
                  key={src + i}
                  aria-hidden
                  className={`relative aspect-square overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 ${
                    i % 2 === 1 ? 'sm:translate-y-4' : ''
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 33vw, 17vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rest of collections */}
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
            Todas las colecciones
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Para cada viaje, una colección
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {rest.map((c, i) => (
              <Link
                key={c.slug}
                href={`/colecciones/${c.slug}`}
                className={`group relative flex overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl ${
                  i === 0 || i === 3 ? 'md:col-span-2 md:aspect-[2.8/1]' : ''
                }`}
              >
                <div className={`relative ${i === 0 || i === 3 ? 'aspect-[2.8/1] w-full' : 'aspect-[4/3] w-full'} overflow-hidden`}>
                  {c.cover ? (
                    <Image
                      src={c.cover}
                      alt={c.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-cover transition duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${c.meta.tint}`} />
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-t ${c.meta.gradient}`} />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-800 shadow-sm backdrop-blur-sm">
                    {c.meta.tag}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <h3 className="text-balance text-xl font-bold leading-tight text-white drop-shadow-md sm:text-2xl">
                      {c.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/90">
                      {c.description}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
                        <MapPin className="h-3 w-3" /> {c.stats.placeCount} destinos
                      </span>
                      {c.stats.states.map((state) => (
                        <span key={state} className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
                          {state}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-3xl bg-gradient-to-br from-slate-900 via-rose-900 to-slate-900 p-8 text-white shadow-xl sm:p-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300">
                ¿No encontraste la tuya?
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Crea una colección a tu medida con Autopilot
              </h2>
              <p className="mt-2 max-w-xl text-slate-200">
                Cuéntale tus fechas, presupuesto y estilo. Te arma un itinerario
                listo con paradas, mapa y costos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/planear"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Probar Autopilot →
              </Link>
              <Link
                href="/guias"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver guías
              </Link>
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}
