import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { getTranslations } from '@/lib/i18n/server';

const PAGE_PATH = '/contacto';
const PAGE_TITLE = 'Contacto';
const PAGE_DESCRIPTION =
  'Ponte en contacto con el equipo de Rutas en MX. Envíanos tus preguntas, sugerencias o reportes sobre la informacion de nuestra plataforma.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    noIndex: true,
  });
}

export default async function ContactoPage() {
  const t = await getTranslations();
  const breadcrumbs = buildBreadcrumbs([{ label: t.common.contact, href: PAGE_PATH }]);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

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
            {t.pages.contacto.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            {t.pages.contacto.description}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Formulario de contacto */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900">
              {t.pages.contacto.sendMessage}
            </h2>
            <form className="mt-6 space-y-6">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-zinc-700"
                >
                  {t.pages.contacto.fullName}
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  autoComplete="name"
                  required
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder={t.pages.contacto.fullNamePlaceholder}
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-700"
                >
                  {t.pages.contacto.emailLabel}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder={t.pages.contacto.emailPlaceholder}
                />
              </div>
              <div>
                <label
                  htmlFor="asunto"
                  className="block text-sm font-medium text-zinc-700"
                >
                  {t.pages.contacto.subject}
                </label>
                <select
                  id="asunto"
                  name="asunto"
                  required
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t.pages.contacto.subjectPlaceholder}</option>
                  <option value="pregunta">{t.pages.contacto.subjectGeneral}</option>
                  <option value="sugerencia">{t.pages.contacto.subjectSuggestion}</option>
                  <option value="error">{t.pages.contacto.subjectError}</option>
                  <option value="colaboracion">{t.pages.contacto.subjectCollaboration}</option>
                  <option value="prensa">{t.pages.contacto.subjectPress}</option>
                  <option value="otro">{t.pages.contacto.subjectOther}</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="mensaje"
                  className="block text-sm font-medium text-zinc-700"
                >
                  {t.pages.contacto.message}
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  rows={5}
                  required
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder={t.pages.contacto.messagePlaceholder}
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {t.pages.contacto.sendButton}
              </button>
              <p className="text-xs text-zinc-500">
                {t.pages.contacto.privacyNotice}{' '}
                <Link href="/privacidad" className="text-blue-600 hover:underline">
                  {t.pages.contacto.privacyPolicy}
                </Link>
                .
              </p>
            </form>
          </section>

          {/* Informacion de contacto */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900">
              {t.pages.contacto.otherWays}
            </h2>
            <div className="mt-6 space-y-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-base font-semibold text-zinc-900">
                  {t.pages.contacto.emailTitle}
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  {t.pages.contacto.forGeneralInquiries}
                </p>
                <a
                  href="mailto:soporte@rutasenmx.com"
                  className="mt-1 inline-block text-sm font-medium text-blue-600 hover:underline"
                >
                  soporte@rutasenmx.com
                </a>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-base font-semibold text-zinc-900">
                  {t.pages.contacto.reportErrors}
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  {t.pages.contacto.reportErrorsDesc}{' '}
                  <Link
                    href="/correcciones"
                    className="text-blue-600 hover:underline"
                  >
                    {t.pages.contacto.corrections}
                  </Link>{' '}
                  {t.pages.contacto.reportErrorsSuffix}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-base font-semibold text-zinc-900">
                  {t.pages.contacto.responseTimes}
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  {t.pages.contacto.responseTimesDesc}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-base font-semibold text-zinc-900">
                  {t.pages.contacto.collaborationsAndPress}
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  {t.pages.contacto.collaborationsDesc}{' '}
                  <a
                    href="mailto:colaboraciones@rutasenmx.com"
                    className="text-blue-600 hover:underline"
                  >
                    colaboraciones@rutasenmx.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
