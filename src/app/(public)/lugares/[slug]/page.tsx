import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { lugarBreadcrumbs } from '@/lib/seo/breadcrumbs';
import {
  buildBreadcrumbSchema,
  buildPlaceSchema,
  buildMuseumSchema,
  buildArchaeologicalSiteSchema,
  buildBeachSchema,
  buildWebPageSchema,
  buildGraph,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { PlaceMiniMap } from '@/components/map/PlaceMiniMap';
import { FavoriteHeartButton } from '@/components/favorites/FavoriteHeartButton';
import { PLACE_CATEGORIES } from '@/lib/constants';
import {
  mockPlaces,
  getPlaceBySlug,
  getNearbyPlaces,
  getPlacesByStateAndCategory,
} from '@/lib/data/mock';
import { getTranslations } from '@/lib/i18n/server';

interface Props {
  params: Promise<{ slug: string }>;
}

function getCategoryInfo(slug: string) {
  return PLACE_CATEGORIES.find((c) => c.slug === slug) || { color: '#6B7280', emoji: '📍', name: slug };
}

function getCategoryHref(cat: string) {
  const map: Record<string, string> = {
    'pueblos-magicos': '/pueblos-magicos',
    'museos': '/museos',
    'zonas-arqueologicas': '/zonas-arqueologicas',
    'playas': '/explorar?category=playas',
    'cenotes': '/explorar?category=cenotes',
    'cascadas': '/explorar?category=cascadas',
    'haciendas': '/explorar?category=haciendas',
    'centros-historicos': '/explorar?category=centros-historicos',
  };
  return map[cat] || '/explorar';
}

export async function generateStaticParams() {
  // Only generate for places with meaningful descriptions (>50 chars)
  return mockPlaces
    .filter((p) => p.description && p.description.length > 30)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);
  if (!place) return {};

  return buildPageMetadata({
    title: `${place.name}, ${place.stateName}: qué hacer, mapa y cómo llegar`,
    description: place.description,
    path: `/lugares/${place.slug}`,
    keywords: [
      place.name,
      `${place.name} ${place.stateName}`,
      `qué hacer en ${place.name}`,
      `cómo llegar a ${place.name}`,
      place.categoryName,
    ],
  });
}

export default async function LugarPage({ params }: Props) {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);
  if (!place) notFound();

  const t = await getTranslations();
  const interp = (template: string, vars: Record<string, string>) =>
    Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
      template,
    );
  const catInfo = getCategoryInfo(place.category);
  const categoryHref = getCategoryHref(place.category);
  const nearbyPlaces = getNearbyPlaces(slug, 6);
  const sameCategoryInState = getPlacesByStateAndCategory(place.stateSlug, place.category)
    .filter((p) => p.slug !== slug)
    .slice(0, 6);

  const breadcrumbs = lugarBreadcrumbs(
    place.name, place.slug, place.categoryName, place.category, place.stateName, place.stateSlug,
  );

  const sharedPlaceInput = {
    name: place.name,
    slug: place.slug,
    description: place.description,
    image: place.image,
    latitude: place.lat,
    longitude: place.lng,
    address: place.address,
    estado: place.stateName,
    tags: place.badges,
    openingHours: place.openingHours,
    telephone: place.telephone,
    priceRange: place.price,
    website: place.website,
    category: place.categoryName,
  };

  const placeSchema =
    place.category === 'museos'
      ? buildMuseumSchema(sharedPlaceInput)
      : place.category === 'zonas-arqueologicas'
        ? buildArchaeologicalSiteSchema(sharedPlaceInput)
        : place.category === 'playas'
          ? buildBeachSchema(sharedPlaceInput)
          : buildPlaceSchema(sharedPlaceInput);

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const graph = buildGraph([
    buildWebPageSchema(
      `${place.name}, ${place.stateName} — ${place.categoryName}`,
      place.description,
      `/lugares/${place.slug}`,
      {
        primaryImage: place.image,
        lastReviewed: new Date().toISOString().split('T')[0],
      },
    ),
    placeSchema,
    breadcrumbSchema,
  ]);

  return (
    <>
      <JsonLd data={graph} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Link
              href={categoryHref}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: catInfo.color }}
            >
              <span>{catInfo.emoji}</span>
              {place.categoryName}
            </Link>
            <Link
              href={`/estados/${place.stateSlug}`}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
            >
              📍 {place.stateName}
            </Link>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {place.name}
            </h1>
            <FavoriteHeartButton slug={place.slug} placeName={place.name} />
          </div>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">
            {place.description}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* MAP - Real interactive Mapbox map */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-slate-900">
                🗺️ {t.place.location}
              </h2>
              <PlaceMiniMap
                lat={place.lat}
                lng={place.lng}
                name={place.name}
                className="h-72 sm:h-80"
              />
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>📍 {place.lat.toFixed(5)}, {place.lng.toFixed(5)}</span>
                {place.address && <span>🏠 {place.address}</span>}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-600 hover:text-emerald-700"
                >
                  🚗 {t.place.howToGet} →
                </a>
                <a
                  href={`https://www.waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-600 hover:text-emerald-700"
                >
                  {t.place.openInWaze}
                </a>
              </div>
            </section>

            {/* About */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-slate-900">
                {catInfo.emoji} {t.place.about} {place.name}
              </h2>
              <div className="rounded-2xl bg-slate-50 p-6">
                <p className="leading-7 text-slate-700">
                  {place.longDescription || place.description}
                </p>
              </div>
            </section>

            {/* Badges */}
            {place.badges.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-slate-900">
                  🏅 {t.place.recognitions}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {place.badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-200"
                    >
                      ✅ {badge.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Quick navigation links */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-slate-900">
                🚗 {t.place.quickNavigation}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md hover:border-emerald-300"
                >
                  <span className="text-2xl">🗺️</span>
                  <div>
                    <p className="font-semibold text-slate-900">Google Maps</p>
                    <p className="text-xs text-slate-500">{t.place.googleMapsDirections}</p>
                  </div>
                </a>
                <a
                  href={`https://www.waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md hover:border-emerald-300"
                >
                  <span className="text-2xl">🚙</span>
                  <div>
                    <p className="font-semibold text-slate-900">Waze</p>
                    <p className="text-xs text-slate-500">{t.place.wazeTraffic}</p>
                  </div>
                </a>
              </div>
            </section>

            {/* Same category in state */}
            {sameCategoryInState.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                  {catInfo.emoji}{' '}
                  {interp(t.place.moreCategoryInState, {
                    category: place.categoryName.toLowerCase(),
                    state: place.stateName,
                  })}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {sameCategoryInState.map((p) => {
                    const pCat = getCategoryInfo(p.category);
                    return (
                      <Link
                        key={p.slug}
                        href={`/lugares/${p.slug}`}
                        className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md"
                      >
                        <span className="mt-0.5 text-lg">{pCat.emoji}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition">{p.name}</h3>
                          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{p.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Nearby places */}
            {nearbyPlaces.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                  📍 {t.place.nearbyPlaces}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {nearbyPlaces.map((p) => {
                    const pCat = getCategoryInfo(p.category);
                    return (
                      <Link
                        key={p.slug}
                        href={`/lugares/${p.slug}`}
                        className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">{pCat.emoji}</span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: pCat.color }}>
                            {p.categoryName}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition">{p.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">{p.stateName}</p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Practical info card */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-3" style={{ backgroundColor: catInfo.color }}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  {catInfo.emoji} {t.place.practicalInfo}
                </h3>
              </div>
              <dl className="divide-y divide-slate-100 px-5">
                {place.openingHours && (
                  <div className="py-3">
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">🕐 {t.place.schedule}</dt>
                    <dd className="mt-1 text-sm text-slate-900">{place.openingHours}</dd>
                  </div>
                )}
                {place.price && (
                  <div className="py-3">
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">💰 {t.place.price}</dt>
                    <dd className="mt-1 text-sm text-slate-900">{place.price}</dd>
                  </div>
                )}
                {place.telephone && (
                  <div className="py-3">
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">📞 {t.place.telephone}</dt>
                    <dd className="mt-1 text-sm text-slate-900">{place.telephone}</dd>
                  </div>
                )}
                {place.address && (
                  <div className="py-3">
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">🏠 {t.place.address}</dt>
                    <dd className="mt-1 text-sm text-slate-900">{place.address}</dd>
                  </div>
                )}
                {place.website && (
                  <div className="py-3">
                    <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">🌐 {t.place.website}</dt>
                    <dd className="mt-1">
                      <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                        {t.place.visitSite}
                      </a>
                    </dd>
                  </div>
                )}
                <div className="py-3">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">📍 {t.place.coordinates}</dt>
                  <dd className="mt-1 text-sm text-slate-900 font-mono">{place.lat.toFixed(5)}, {place.lng.toFixed(5)}</dd>
                </div>
                <div className="py-3">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">🏷️ {t.place.category}</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: catInfo.color }}>
                      {catInfo.emoji} {place.categoryName}
                    </span>
                  </dd>
                </div>
                <div className="py-3">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">📌 {t.place.state}</dt>
                  <dd className="mt-1 text-sm text-slate-900">{place.stateName}</dd>
                </div>
              </dl>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                🚗 {t.place.howToGet}
              </a>
              <Link
                href="/planear"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-50"
              >
                ➕ {t.place.addToMyRoute}
              </Link>
            </div>

            {/* Explore state */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-900">
                🗺️ {interp(t.place.exploreState, { state: place.stateName })}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {interp(t.place.exploreStateDesc, { state: place.stateName })}
              </p>
              <Link
                href={`/estados/${place.stateSlug}`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {interp(t.place.viewStateLink, { state: place.stateName })}
              </Link>
            </div>

            {/* Explore category */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-900">{catInfo.emoji} {place.categoryName}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {interp(t.place.exploreCategoryDesc, {
                  category: place.categoryName.toLowerCase(),
                })}
              </p>
              <Link
                href={categoryHref}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {t.place.viewAllCategory}
              </Link>
            </div>

            {/* Plan trip */}
            <div className="rounded-2xl bg-black p-5 text-white">
              <h3 className="font-semibold">✨ {t.place.planYourTrip}</h3>
              <p className="mt-1 text-sm text-white/70">
                {interp(t.place.planYourTripDesc, { place: place.name })}
              </p>
              <Link
                href="/planear"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
              >
                {t.place.startPlanning}
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
