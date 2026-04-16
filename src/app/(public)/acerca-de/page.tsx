import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema, buildOrganizationSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { getTranslations } from '@/lib/i18n/server';

const PAGE_PATH = '/acerca-de';
const PAGE_TITLE = 'Acerca de Rutas en MX';
const PAGE_DESCRIPTION =
  'Conoce la mision, el equipo y la historia detras de Rutas en MX: la plataforma de planificacion de viajes por carretera en Mexico.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    noIndex: false,
    keywords: [
      'acerca de Rutas en MX',
      'viajes por carretera Mexico',
      'planificacion de rutas',
      'turismo en Mexico',
    ],
  });
}

export default async function AcercaDePage() {
  const t = await getTranslations();
  const breadcrumbs = buildBreadcrumbs([{ label: t.common.about, href: PAGE_PATH }]);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);
  const organizationSchema = buildOrganizationSchema();

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={organizationSchema} />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-zinc-500">
          <ol className="flex items-center gap-2">
            {breadcrumbs.map((item, idx) => (
              <li key={item.href} className="flex items-center gap-2">
                {idx > 0 && <span aria-hidden="true">/</span>}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-zinc-900">{item.label}</span>
                ) : (
                  <Link href={item.href} className="hover:text-zinc-900">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            {t.pages.acercaDe.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.acercaDe.description}
          </p>
        </header>

        {/* Nuestra mision */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">{t.pages.acercaDe.ourMission}</h2>
          <p className="mt-4 text-zinc-600 leading-7">
            {t.pages.acercaDe.missionP1}
          </p>
          <p className="mt-4 text-zinc-600 leading-7">
            {t.pages.acercaDe.missionP2}
          </p>
        </section>

        {/* Que hacemos */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">{t.pages.acercaDe.whatWeDo}</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.pages.acercaDe.roadRoutes}
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                {t.pages.acercaDe.roadRoutesDesc}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.pages.acercaDe.destinationDirectory}
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                {t.pages.acercaDe.destinationDirectoryDesc}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.pages.acercaDe.travelGuides}
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                {t.pages.acercaDe.travelGuidesDesc}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.pages.acercaDe.tripPlanner}
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                {t.pages.acercaDe.tripPlannerDesc}
              </p>
            </div>
          </div>
        </section>

        {/* Nuestro equipo */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">{t.pages.acercaDe.ourTeam}</h2>
          <p className="mt-4 text-zinc-600 leading-7">
            {t.pages.acercaDe.teamP1}
          </p>
          <p className="mt-4 text-zinc-600 leading-7">
            {t.pages.acercaDe.teamP2}{' '}
            <Link href="/metodologia" className="text-blue-600 hover:underline">
              {t.pages.acercaDe.methodology}
            </Link>{' '}
            &{' '}
            <Link href="/fuentes-de-datos" className="text-blue-600 hover:underline">
              {t.pages.acercaDe.dataSources}
            </Link>
            .
          </p>
        </section>

        {/* Nuestros valores */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-zinc-900">{t.pages.acercaDe.ourValues}</h2>
          <ul className="mt-6 space-y-4">
            <li className="flex gap-4">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                1
              </span>
              <div>
                <h3 className="font-semibold text-zinc-900">{t.pages.acercaDe.valueAccuracy}</h3>
                <p className="text-sm text-zinc-600">
                  {t.pages.acercaDe.valueAccuracyDesc}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                2
              </span>
              <div>
                <h3 className="font-semibold text-zinc-900">{t.pages.acercaDe.valueAccessibility}</h3>
                <p className="text-sm text-zinc-600">
                  {t.pages.acercaDe.valueAccessibilityDesc}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                3
              </span>
              <div>
                <h3 className="font-semibold text-zinc-900">{t.pages.acercaDe.valueTransparency}</h3>
                <p className="text-sm text-zinc-600">
                  {t.pages.acercaDe.valueTransparencyDesc}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                4
              </span>
              <div>
                <h3 className="font-semibold text-zinc-900">
                  {t.pages.acercaDe.valueResponsibleTourism}
                </h3>
                <p className="text-sm text-zinc-600">
                  {t.pages.acercaDe.valueResponsibleTourismDesc}
                </p>
              </div>
            </li>
          </ul>
        </section>

        {/* Contacto CTA */}
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
          <h2 className="text-xl font-bold text-zinc-900">
            {t.pages.acercaDe.questionsOrSuggestions}
          </h2>
          <p className="mt-2 text-zinc-600">
            {t.pages.acercaDe.loveToHear}
          </p>
          <Link
            href="/contacto"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {t.pages.acercaDe.contactUs}
          </Link>
        </section>
      </main>
    </>
  );
}
