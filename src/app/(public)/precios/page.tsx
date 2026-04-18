import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PricingTableV2 } from '@/components/subscription/PricingTableV2';
import { getLocale, getTranslations } from '@/lib/i18n/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildFAQSchema,
  buildProductSchema,
  buildBreadcrumbSchema,
  buildGraph,
  buildWebPageSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { Fragment } from 'react';
import { PLANS } from '@/lib/subscription/plans';
import { pickDecorations } from '@/lib/data/general-images';
import {
  Sparkles,
  Shield,
  CreditCard,
  RefreshCw,
  Headphones,
  ArrowRight,
  Star,
  CheckCircle2,
} from 'lucide-react';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Planes y precios · Rutas en MX — Gratis, Básico, Pro y Premium',
    description:
      'Planes y precios para planear tus viajes por México: Gratis para empezar, Básico, Pro y Premium con IA Autopilot, exportación PDF/GPX, modo offline y más. Precios en MXN con IVA.',
    path: '/precios',
    keywords: [
      'precios Rutas en MX',
      'planes suscripción viajes México',
      'ia autopilot precio',
      'planificador de rutas México precio',
      'suscripción planificador viajes',
      'plan gratis rutas México',
      'plan premium viajes México',
    ],
  });
}

const FEATURE_ROWS_ES: Array<{ label: string; free: string | boolean; basic: string | boolean; pro: string | boolean; premium: string | boolean; group: string }> = [
  { group: 'Viaje', label: 'Viajes guardados', free: '1', basic: '3', pro: '5', premium: 'Ilimitados' },
  { group: 'Viaje', label: 'Paradas por viaje', free: '7', basic: '20', pro: '50', premium: '150' },
  { group: 'Viaje', label: 'Mapa interactivo', free: true, basic: true, pro: true, premium: true },
  { group: 'Viaje', label: 'Exploración de lugares', free: true, basic: true, pro: true, premium: true },
  { group: 'Experiencia', label: 'Sin anuncios', free: false, basic: false, pro: true, premium: true },
  { group: 'Experiencia', label: 'Colaboración multi-persona', free: false, basic: false, pro: true, premium: true },
  { group: 'Experiencia', label: 'IA Autopilot', free: false, basic: false, pro: false, premium: true },
  { group: 'Experiencia', label: 'Modo offline', free: false, basic: false, pro: false, premium: true },
  { group: 'Exportar', label: 'PDF / GPX', free: false, basic: true, pro: true, premium: true },
  { group: 'Exportar', label: 'Compartir link', free: true, basic: true, pro: true, premium: true },
  { group: 'Exportar', label: 'Soporte', free: 'Comunidad', basic: 'Email', pro: 'Prioritario', premium: 'Prioritario 24/7' },
];

const FEATURE_ROWS_EN: typeof FEATURE_ROWS_ES = [
  { group: 'Trip', label: 'Saved trips', free: '1', basic: '3', pro: '5', premium: 'Unlimited' },
  { group: 'Trip', label: 'Stops per trip', free: '7', basic: '20', pro: '50', premium: '150' },
  { group: 'Trip', label: 'Interactive map', free: true, basic: true, pro: true, premium: true },
  { group: 'Trip', label: 'Place exploration', free: true, basic: true, pro: true, premium: true },
  { group: 'Experience', label: 'Ad-free', free: false, basic: false, pro: true, premium: true },
  { group: 'Experience', label: 'Multi-user collaboration', free: false, basic: false, pro: true, premium: true },
  { group: 'Experience', label: 'AI Autopilot', free: false, basic: false, pro: false, premium: true },
  { group: 'Experience', label: 'Offline mode', free: false, basic: false, pro: false, premium: true },
  { group: 'Export', label: 'PDF / GPX', free: false, basic: true, pro: true, premium: true },
  { group: 'Export', label: 'Shareable links', free: true, basic: true, pro: true, premium: true },
  { group: 'Export', label: 'Support', free: 'Community', basic: 'Email', pro: 'Priority', premium: 'Priority 24/7' },
];

export default async function PreciosPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const isEn = locale === 'en';

  const FAQ_ITEMS = [
    { question: t.pages.precios.faqChangePlan, answer: t.pages.precios.faqChangePlanAnswer },
    { question: t.pages.precios.faqPaymentMethods, answer: t.pages.precios.faqPaymentMethodsAnswer },
    { question: t.pages.precios.faqCancel, answer: t.pages.precios.faqCancelAnswer },
    { question: t.pages.precios.faqDowngrade, answer: t.pages.precios.faqDowngradeAnswer },
    { question: t.pages.precios.faqDiscounts, answer: t.pages.precios.faqDiscountsAnswer },
  ];

  const breadcrumbs = [
    { label: t.common.home, href: '/' },
    { label: t.common.pricing, href: '/precios' },
  ];

  const graph = buildGraph([
    buildWebPageSchema(
      isEn ? 'Plans and pricing · Rutas en MX' : 'Planes y precios · Rutas en MX',
      isEn
        ? 'Plans and pricing to plan your road trips across Mexico.'
        : 'Planes y precios para planear tus rutas por México.',
      '/precios',
      { lastReviewed: new Date().toISOString().split('T')[0] },
    ),
    buildBreadcrumbSchema(breadcrumbs),
    buildFAQSchema(FAQ_ITEMS),
    ...PLANS.filter((p) => p.priceMonthly > 0).map((p) =>
      buildProductSchema({
        name: p.name,
        description: p.description,
        priceMonthly: p.priceMonthly,
        priceAnnual: p.priceAnnual,
        slug: p.slug,
        features: p.features.filter((f) => f.included).map((f) => f.label),
      }),
    ),
  ]);

  const decor = pickDecorations('precios-page', 4);
  const featureRows = isEn ? FEATURE_ROWS_EN : FEATURE_ROWS_ES;
  const groupedRows = featureRows.reduce<Record<string, typeof featureRows>>((acc, row) => {
    acc[row.group] = acc[row.group] ?? [];
    acc[row.group].push(row);
    return acc;
  }, {});

  return (
    <>
      <JsonLd data={graph} />

      {/* ============================================================ */}
      {/* HERO                                                         */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-emerald-50/50 via-white to-white">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-emerald-200/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-32 -bottom-20 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />

        {decor[0] && (
          <div className="pointer-events-none absolute right-12 top-16 hidden lg:block" aria-hidden>
            <div className="relative h-28 w-28 overflow-hidden rounded-full shadow-xl ring-[6px] ring-white">
              <Image src={decor[0]} alt="" fill sizes="120px" className="object-cover" />
            </div>
          </div>
        )}
        {decor[1] && (
          <div className="pointer-events-none absolute bottom-20 right-48 hidden xl:block" aria-hidden>
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl shadow-xl ring-[6px] ring-white">
              <Image src={decor[1]} alt="" fill sizes="96px" className="object-cover" />
            </div>
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <Sparkles className="h-3 w-3" />
            {isEn ? 'Simple pricing' : 'Precios simples'}
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {isEn ? 'Plan better trips, for the price of a taco' : 'Mejora tus viajes, por el costo de unos tacos'}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-8 text-slate-600">
            {isEn
              ? 'Start free. Upgrade when you are ready for AI itineraries, offline mode, PDF/GPX export and more.'
              : 'Empieza gratis. Mejora cuando necesites itinerarios con IA, modo offline, exportación PDF/GPX y más.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-600" /> {isEn ? 'Cancel any time' : 'Cancela cuando quieras'}</span>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4 text-emerald-600" /> {isEn ? '14-day refund' : 'Devolución 14 días'}</span>
            <span className="inline-flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-emerald-600" /> {isEn ? 'Secure via Stripe' : 'Pago seguro con Stripe'}</span>
            <span className="inline-flex items-center gap-1.5"><Headphones className="h-4 w-4 text-emerald-600" /> {isEn ? 'Human support' : 'Soporte humano'}</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRICING CARDS                                                */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 lg:px-8">
        <PricingTableV2 />
      </section>

      {/* ============================================================ */}
      {/* FEATURE COMPARISON                                           */}
      {/* ============================================================ */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {isEn ? 'Compare features' : 'Compara características'}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {isEn ? 'Everything you get, by plan' : 'Todo lo que obtienes, por plan'}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              {isEn
                ? 'Full breakdown of what each plan unlocks. Scroll horizontally on small screens.'
                : 'Detalle completo de lo que desbloquea cada plan. Desliza horizontalmente en pantallas pequeñas.'}
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {isEn ? 'Feature' : 'Característica'}
                    </th>
                    {PLANS.map((p) => (
                      <th
                        key={p.slug}
                        scope="col"
                        className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider ${
                          p.isRecommended ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {p.name}
                        {p.isRecommended && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                            {isEn ? 'Best' : 'Top'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {Object.entries(groupedRows).map(([group, rows]) => (
                    <Fragment key={`group-${group}`}>
                      <tr className="bg-slate-50/60">
                        <td colSpan={5} className="px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {group}
                        </td>
                      </tr>
                      {rows.map((row, i) => (
                        <tr key={`${group}-${i}`} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3 text-sm font-medium text-slate-800">{row.label}</td>
                          {(['free', 'basic', 'pro', 'premium'] as const).map((k) => {
                            const v = row[k];
                            const recommended = k === 'pro';
                            return (
                              <td key={k} className={`px-5 py-3 text-sm ${recommended ? 'bg-emerald-50/40' : ''}`}>
                                {typeof v === 'boolean' ? (
                                  v ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )
                                ) : (
                                  <span className="font-medium text-slate-700">{v}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TRUST / TESTIMONIALS                                          */}
      {/* ============================================================ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {isEn ? 'Built for travellers' : 'Hecho para viajeros'}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {isEn ? 'Everything you need, nothing you don’t' : 'Todo lo que necesitas, nada que sobre'}
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                {isEn
                  ? 'We charge only for the features that take real engineering or a paid API behind the scenes (AI itineraries, map APIs, offline packs). Core exploration stays free forever.'
                  : 'Sólo cobramos por funciones que requieren ingeniería real o una API de pago detrás (itinerarios IA, APIs de mapas, paquetes offline). La exploración básica siempre será gratis.'}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { n: '32', l: isEn ? 'States covered' : 'Estados cubiertos' },
                  { n: '2,000+', l: isEn ? 'Verified places' : 'Lugares verificados' },
                  { n: '100+', l: isEn ? 'Curated routes' : 'Rutas curadas' },
                  { n: '240+', l: isEn ? 'Editorial guides' : 'Guías editoriales' },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                    <p className="text-3xl font-extrabold tracking-tight text-slate-900">{s.n}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 p-6 shadow-sm">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                {isEn
                  ? '"Planned a 10-day trip through Oaxaca in under 20 minutes. Tolls, fuel and stops all in one place."'
                  : '"Planeé un viaje de 10 días por Oaxaca en menos de 20 minutos. Casetas, gasolina y paradas, todo en un solo lugar."'}
              </p>
              <p className="mt-4 text-xs font-semibold text-slate-900">Mariana G.</p>
              <p className="text-xs text-slate-500">{isEn ? 'Pro subscriber · Guadalajara' : 'Suscriptora Pro · Guadalajara'}</p>

              {decor[2] && (
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <div className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-black/5">
                    <Image src={decor[2]} alt="" fill sizes="160px" className="object-cover" />
                  </div>
                  {decor[3] && (
                    <div className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-black/5">
                      <Image src={decor[3]} alt="" fill sizes="160px" className="object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ                                                          */}
      {/* ============================================================ */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            FAQ
          </p>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t.pages.precios.faq}
          </h2>

          <div className="mt-10 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 open:border-emerald-300"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-base font-semibold text-slate-900 marker:content-['']">
                  <span>{item.question}</span>
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition group-open:rotate-45"
                  >
                    <span className="block h-[2px] w-3 bg-current" />
                    <span className="absolute block h-3 w-[2px] bg-current" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FINAL CTA                                                    */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 py-20 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            {isEn ? 'Ready to hit the road?' : '¿Listos para salir a la carretera?'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-200">
            {isEn
              ? 'Join thousands of travellers exploring Mexico with a real plan.'
              : 'Únete a miles de viajeros que descubren México con un plan de verdad.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/registrarse"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-emerald-300"
            >
              {isEn ? 'Start free' : 'Empezar gratis'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/autopilot"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              {isEn ? 'Try AI Autopilot' : 'Probar Autopilot IA'}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
