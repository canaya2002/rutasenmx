import Link from 'next/link';
import { FileText, ShieldCheck, Scale, Pencil, Scroll } from 'lucide-react';
import { DecorBlob, DecorCircle } from '@/components/decor/DecorImage';
import { pickDecorations } from '@/lib/data/general-images';

export interface LegalSection {
  id: string;
  title: string;
}

export interface LegalShellProps {
  /** Display title, e.g. "Política de privacidad" */
  title: string;
  /** Tagline shown under the h1. */
  summary: string;
  /** Kicker above the title, e.g. "Legal · Privacidad". */
  kicker?: string;
  /** ISO date (YYYY-MM-DD) of the latest revision. */
  lastUpdated?: string;
  /** Effective date (when this version took/takes effect). */
  effectiveDate?: string;
  /** Short document version (e.g. "v2.0"). */
  version?: string;
  /** Estimated reading time in minutes. */
  readingMinutes?: number;
  /** Locale for formatting + nav labels. */
  isEn: boolean;
  /** Table-of-contents sections (anchors inside the content). */
  sections: LegalSection[];
  /** Which legal page is active — controls nav highlighting. */
  current: 'privacidad' | 'terminos' | 'politica-editorial' | 'correcciones';
  /** Main body (sections should use `id` from `sections` for anchor scroll). */
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { slug: 'privacidad',         es: 'Privacidad',         en: 'Privacy',          icon: ShieldCheck, href: '/privacidad' },
  { slug: 'terminos',           es: 'Términos',           en: 'Terms',            icon: Scale,       href: '/terminos' },
  { slug: 'politica-editorial', es: 'Política editorial', en: 'Editorial policy', icon: Pencil,      href: '/politica-editorial' },
  { slug: 'correcciones',       es: 'Correcciones',       en: 'Corrections',      icon: Scroll,      href: '/correcciones' },
] as const;

function formatDate(iso: string | undefined, isEn: boolean): string | null {
  if (!iso) return null;
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function LegalShell({
  title,
  summary,
  kicker,
  lastUpdated,
  effectiveDate,
  version,
  readingMinutes,
  isEn,
  sections,
  current,
  children,
}: LegalShellProps) {
  const updatedLabel = isEn ? 'Last updated' : 'Última actualización';
  const effectiveLabel = isEn ? 'Effective' : 'Vigente desde';
  const versionLabel = isEn ? 'Version' : 'Versión';
  const readLabel = isEn ? 'Reading time' : 'Tiempo de lectura';
  const tocLabel = isEn ? 'On this page' : 'En esta página';
  const relatedLabel = isEn ? 'Legal documents' : 'Documentos legales';
  const contactLabel = isEn ? 'Questions? Write to us' : '¿Dudas? Escríbenos';
  const contactDesc = isEn
    ? 'Our privacy team reads every message and answers within 10 business days.'
    : 'Nuestro equipo responde cada mensaje en un máximo de 10 días hábiles.';

  const decor = pickDecorations(`legal-${current}`, 2);

  return (
    <main className="bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <DecorBlob color="bg-emerald-200/30" className="-right-32 -top-32 h-96 w-96" />
        <DecorBlob color="bg-sky-200/30" className="-left-32 bottom-0 h-80 w-80" />
        {decor[0] && (
          <div className="pointer-events-none absolute right-4 top-8 hidden lg:block" aria-hidden>
            <DecorCircle src={decor[0]} size="h-36 w-36" rotate={-6} />
          </div>
        )}
        {decor[1] && (
          <div className="pointer-events-none absolute bottom-6 right-44 hidden lg:block" aria-hidden>
            <DecorCircle src={decor[1]} size="h-20 w-20" rotate={8} ringColor="ring-emerald-100" />
          </div>
        )}
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          {kicker && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <FileText className="h-3 w-3" />
              {kicker}
            </span>
          )}
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-balance text-lg leading-8 text-slate-600">
            {summary}
          </p>

          {/* Meta pills */}
          <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {lastUpdated && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{updatedLabel}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(lastUpdated, isEn)}</dd>
              </div>
            )}
            {effectiveDate && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{effectiveLabel}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(effectiveDate, isEn)}</dd>
              </div>
            )}
            {version && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{versionLabel}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{version}</dd>
              </div>
            )}
            {readingMinutes != null && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{readLabel}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  ~{readingMinutes} {isEn ? 'min' : 'min'}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      {/* Sub-nav across the 4 legal pages */}
      <nav
        aria-label={relatedLabel}
        className="sticky top-16 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
          {NAV_ITEMS.map((item) => {
            const active = item.slug === current;
            const Icon = item.icon;
            const label = isEn ? item.en : item.es;
            return (
              <Link
                key={item.slug}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Body: ToC + content */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
          {/* ToC */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {tocLabel}
              </p>
              <ol className="space-y-1">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm leading-snug text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                        {i + 1}
                      </span>
                      <span>{s.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          {/* Content — generous spacing so sections never look crowded */}
          <article className="prose prose-slate max-w-none leading-7 prose-headings:scroll-mt-32 prose-headings:tracking-tight prose-h2:mt-14 prose-h2:mb-4 prose-h2:text-2xl prose-h2:font-bold prose-h2:text-slate-900 prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:text-slate-900 prose-p:my-4 prose-p:leading-7 prose-ul:my-4 prose-ol:my-4 prose-li:my-1.5 prose-li:leading-7 prose-a:text-emerald-700 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 [&>section]:mb-10 [&>section]:rounded-3xl [&>section]:border [&>section]:border-slate-100 [&>section]:bg-white [&>section]:p-6 [&>section]:shadow-sm sm:[&>section]:p-8 [&>section]:first-of-type:mt-0 [&>section_h2]:first:mt-0">
            {children}
          </article>
        </div>

        {/* Contact card */}
        <aside className="mt-16 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {isEn ? 'Contact' : 'Contacto'}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{contactLabel}</h2>
              <p className="mt-1 text-sm text-slate-600">{contactDesc}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/contacto"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {isEn ? 'Contact form' : 'Formulario'}
              </Link>
              <a
                href="mailto:legal@rutasenmx.com"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                legal@rutasenmx.com
              </a>
            </div>
          </div>
        </aside>

        {/* Cross-links */}
        <nav aria-label={relatedLabel} className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {NAV_ITEMS.filter((item) => item.slug !== current).map((item) => {
            const Icon = item.icon;
            const label = isEn ? item.en : item.es;
            return (
              <Link
                key={item.slug}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{label}</span>
                  <span className="block text-xs text-slate-500">
                    {isEn ? 'Read document →' : 'Leer documento →'}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </section>
    </main>
  );
}
