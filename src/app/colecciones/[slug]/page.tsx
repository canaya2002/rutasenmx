import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { mockCollections, getPlaceBySlug } from '@/lib/data/mock';
import { PageShell } from '@/components/layout/PageShell';
import { pickDecoration } from '@/lib/data/general-images';
import { RoutePreviewMap, type RoutePreviewStop } from '@/components/map/RoutePreviewMap';
import { StaticMapPreview } from '@/components/map/StaticMapPreview';
import { MapPin, Compass, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return mockCollections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = mockCollections.find((c) => c.slug === slug);
  if (!collection) return {};
  return {
    title: `${collection.name} | Rutas en MX`,
    description: collection.description,
    alternates: { canonical: `https://rutasenmx.com/colecciones/${collection.slug}` },
    openGraph: {
      title: `${collection.name} | Rutas en MX`,
      description: collection.description,
      url: `https://rutasenmx.com/colecciones/${collection.slug}`,
      siteName: 'Rutas en MX',
      locale: 'es_MX',
      type: 'website',
    },
  };
}

export default async function ColeccionPage({ params }: Props) {
  const { slug } = await params;
  const collection = mockCollections.find((c) => c.slug === slug);
  if (!collection) notFound();

  const places = collection.placeSlugs
    .map((s) => getPlaceBySlug(s))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const stateSet = new Set(places.map((p) => p.stateName));
  const categorySet = new Set(places.map((p) => p.categoryName));

  const mapStops: RoutePreviewStop[] = places
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .slice(0, 20)
    .map((p, i) => ({
      id: p.id ?? p.slug,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      category: p.category,
      slug: p.slug,
      order: i + 1,
    }));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description,
    url: `https://rutasenmx.com/colecciones/${collection.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: places.length,
      itemListElement: places.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: `https://rutasenmx.com/lugares/${p.slug}`,
      })),
    },
  };

  const otherCollections = mockCollections
    .filter((c) => c.slug !== slug)
    .slice(0, 4);

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageShell
        title={collection.name}
        kicker={`Colección · ${collection.curatedBy}`}
        summary={collection.description}
        decorKey={`col-${slug}`}
        current="colecciones"
        accent="rose"
        stats={[
          { value: String(places.length), label: 'Destinos' },
          { value: String(stateSet.size), label: 'Estados' },
          { value: String(categorySet.size), label: 'Categorías' },
          { value: 'Editorial', label: 'Curaduría' },
        ]}
      >
        {/* Route overview map */}
        {mapStops.length > 0 && (
          <section className="mb-14">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
              Vista general
            </p>
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
              Todos los destinos en el mapa
            </h2>
            <RoutePreviewMap
              stops={mapStops}
              trace={mapStops.length > 1}
              title={collection.name}
              height="h-[460px]"
              color="#E11D48"
            />
          </section>
        )}

        {/* Filters summary */}
        {(stateSet.size > 0 || categorySet.size > 0) && (
          <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">Cubre estos estados y categorías</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from(stateSet).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                  <MapPin className="h-3 w-3" /> {s}
                </span>
              ))}
              {Array.from(categorySet).map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  <Compass className="h-3 w-3" /> {c}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Destinations grid with map previews */}
        <section className="mb-14">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
            Destinos
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {places.length} paradas cuidadosamente elegidas
          </h2>

          {places.length === 0 ? (
            <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
              <p className="text-slate-500">Esta colección aún no tiene destinos asignados.</p>
            </div>
          ) : (
            <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((place, i) => (
                <li key={place.slug}>
                  <Link
                    href={`/lugares/${place.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {Number.isFinite(place.lat) && Number.isFinite(place.lng) ? (
                        <StaticMapPreview
                          lat={place.lat}
                          lng={place.lng}
                          alt={`Mapa de ${place.name}`}
                          pinColor="E11D48"
                          zoom={11}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-50 to-white text-sm text-rose-700">
                          {place.name}
                        </div>
                      )}
                      <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-rose-700 shadow-md ring-1 ring-rose-100">
                        {i + 1}
                      </span>
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                        {place.categoryName}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-700">
                        {place.name}
                      </h3>
                      <p className="mt-0.5 text-sm font-medium text-rose-700/70">{place.stateName}</p>
                      <p className="mt-2 flex-1 line-clamp-3 text-sm leading-6 text-slate-600">
                        {place.description}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                        Ver detalle <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Related collections */}
        {otherCollections.length > 0 && (
          <section className="mb-14">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
              Sigue explorando
            </p>
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Otras colecciones</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {otherCollections.map((c) => {
                const cover = pickDecoration(`coleccion-cover-${c.slug}`);
                return (
                  <Link
                    key={c.slug}
                    href={`/colecciones/${c.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/5]">
                      {cover ? (
                        <Image src={cover} alt={c.name} fill sizes="300px" className="object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-rose-400 to-slate-800" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-sm font-bold text-white drop-shadow-md">{c.name}</p>
                        <p className="mt-1 text-[11px] font-semibold text-white/80">{c.placeSlugs.length} destinos</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-3xl bg-gradient-to-br from-rose-900 via-slate-900 to-rose-900 p-8 text-white shadow-xl sm:p-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-300">
                ¿Listo para el viaje?
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Convierte esta colección en un itinerario
              </h2>
              <p className="mt-2 max-w-xl text-slate-200">
                Autopilot toma estos destinos, les pone orden, tiempo y mapa, y te lo entrega listo para exportar.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/planear"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <Sparkles className="h-4 w-4" />
                Planear viaje
              </Link>
              <Link
                href="/colecciones"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver todas las colecciones
              </Link>
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}
