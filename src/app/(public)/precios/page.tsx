import type { Metadata } from 'next';
import { PricingTable } from '@/components/subscription/PricingTable';
import Link from 'next/link';
import { getTranslations } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Planes y precios',
  description:
    'Elige el plan ideal para planear tus rutas por Mexico. Desde gratis hasta Premium con IA Autopilot, modo offline y mas.',
  alternates: {
    canonical: '/precios',
  },
};

export default async function PreciosPage() {
  const t = await getTranslations();

  const FAQ_ITEMS = [
    { question: t.pages.precios.faqChangePlan, answer: t.pages.precios.faqChangePlanAnswer },
    { question: t.pages.precios.faqPaymentMethods, answer: t.pages.precios.faqPaymentMethodsAnswer },
    { question: t.pages.precios.faqCancel, answer: t.pages.precios.faqCancelAnswer },
    { question: t.pages.precios.faqDowngrade, answer: t.pages.precios.faqDowngradeAnswer },
    { question: t.pages.precios.faqDiscounts, answer: t.pages.precios.faqDiscountsAnswer },
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Planes y precios | Rutas en MX',
    description:
      'Elige el plan ideal para planear tus rutas por Mexico.',
    url: 'https://rutasenmx.com/precios',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Rutas en MX',
      url: 'https://rutasenmx.com',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-slate-500">
          <li>
            <Link href="/" className="hover:text-slate-700">
              {t.common.home}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-slate-900">{t.common.pricing}</li>
        </ol>
      </nav>

      {/* Header */}
      <section className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {t.pages.precios.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          {t.pages.precios.description}
        </p>
      </section>

      {/* Pricing table */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <PricingTable />
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">
          {t.pages.precios.faq}
        </h2>
        <div className="space-y-6">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="rounded-lg border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900">
                {item.question}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
