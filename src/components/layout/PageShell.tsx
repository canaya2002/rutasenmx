import Link from 'next/link';
import Image from 'next/image';
import { Info, Database, Scale, Mail, Compass, Sparkles } from 'lucide-react';
import { DecorBlob, DecorCircle } from '@/components/decor/DecorImage';
import { pickDecorations } from '@/lib/data/general-images';

export interface PageShellSection {
  id: string;
  title: string;
}

interface PageShellStat {
  value: string;
  label: string;
}

export interface PageShellProps {
  title: string;
  summary?: string;
  kicker?: string;
  /** Used for keying the decoration picker — same slug → same images. */
  decorKey: string;
  /** Optional big hero image on the right side of the hero. */
  heroImage?: string | null;
  /** Optional stats row shown under the hero. */
  stats?: PageShellStat[];
  /** If provided, renders a sticky ToC sidebar on desktop. */
  sections?: PageShellSection[];
  /** Highlight active tab in the "Empresa" sub-nav. Omit to hide sub-nav. */
  current?: 'acerca-de' | 'fuentes-de-datos' | 'metodologia' | 'contacto' | 'colecciones' | 'guias';
  children: React.ReactNode;
  /** Accent color for the kicker pill (Tailwind class snippets). */
  accent?: 'emerald' | 'sky' | 'amber' | 'violet' | 'rose';
}

const SUBNAV = [
  { slug: 'acerca-de',        es: 'Acerca de',       en: 'About',          icon: Info,     href: '/acerca-de' },
  { slug: 'fuentes-de-datos', es: 'Fuentes',         en: 'Data sources',   icon: Database, href: '/fuentes-de-datos' },
  { slug: 'metodologia',      es: 'Metodología',     en: 'Methodology',    icon: Scale,    href: '/metodologia' },
  { slug: 'contacto',         es: 'Contacto',        en: 'Contact',        icon: Mail,     href: '/contacto' },
  { slug: 'guias',            es: 'Guías',           en: 'Guides',         icon: Compass,  href: '/guias' },
  { slug: 'colecciones',      es: 'Colecciones',     en: 'Collections',    icon: Sparkles, href: '/colecciones' },
] as const;

const ACCENTS = {
  emerald: { kicker: 'border-emerald-200 bg-emerald-50 text-emerald-700', blob: 'bg-emerald-200/30' },
  sky:     { kicker: 'border-sky-200 bg-sky-50 text-sky-700',             blob: 'bg-sky-200/30' },
  amber:   { kicker: 'border-amber-200 bg-amber-50 text-amber-700',       blob: 'bg-amber-200/30' },
  violet:  { kicker: 'border-violet-200 bg-violet-50 text-violet-700',    blob: 'bg-violet-200/30' },
  rose:    { kicker: 'border-rose-200 bg-rose-50 text-rose-700',          blob: 'bg-rose-200/30' },
} as const;

/**
 * A premium page shell used across Empresa/Guías/Colecciones pages.
 * - NO breadcrumbs (design choice: global nav + sub-nav is enough).
 * - Decorative images from `/public/General` in the hero.
 * - Sticky sub-navigation across related pages.
 * - Optional sticky ToC for long-form content.
 */
export function PageShell({
  title,
  summary,
  kicker,
  decorKey,
  heroImage = null,
  stats,
  sections,
  current,
  children,
  accent = 'emerald',
}: PageShellProps) {
  // Pick 5 unique decorations for this page (hero + 4 accents) so nothing
  // repeats and no mini-circle shows the same image as the big hero.
  const pool = pickDecorations(decorKey, 5);
  const resolvedHero = heroImage ?? pool[0] ?? null;
  const accent1 = pool.find((p) => p !== resolvedHero) ?? pool[1] ?? null;
  const accent2 = pool.find((p) => p !== resolvedHero && p !== accent1) ?? pool[2] ?? null;
  const accent3 = pool.find((p) => p !== resolvedHero && p !== accent1 && p !== accent2) ?? pool[3] ?? null;
  const decorations = [accent1, accent2, accent3];
  const accentStyle = ACCENTS[accent];

  return (
    <main className="bg-gradient-to-b from-slate-50 via-white to-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <DecorBlob color={accentStyle.blob} className="-right-24 -top-24 h-[28rem] w-[28rem]" />
        <DecorBlob color="bg-slate-200/40" className="-left-24 bottom-0 h-80 w-80" />
        {decorations[0] && (
          <div className="pointer-events-none absolute right-10 top-10 hidden lg:block" aria-hidden>
            <DecorCircle src={decorations[0]} size="h-32 w-32" rotate={-7} />
          </div>
        )}
        {decorations[1] && (
          <div className="pointer-events-none absolute bottom-12 right-52 hidden xl:block" aria-hidden>
            <DecorCircle
              src={decorations[1]}
              size="h-24 w-24"
              rotate={9}
              ringColor="ring-emerald-100"
            />
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              {kicker && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${accentStyle.kicker}`}
                >
                  {kicker}
                </span>
              )}
              <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              {summary && (
                <p className="mt-5 max-w-2xl text-balance text-lg leading-8 text-slate-600">
                  {summary}
                </p>
              )}
              {stats && stats.length > 0 && (
                <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {stat.label}
                      </dt>
                      <dd className="mt-1 text-2xl font-bold text-slate-900">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {/* Optional hero image — overlapping circles composition (every tile uses a unique image) */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto h-[380px] w-[380px]">
                {resolvedHero && (
                  <div className="absolute inset-0 overflow-hidden rounded-[48%_52%_46%_54%/52%_44%_56%_48%] shadow-2xl ring-[6px] ring-white">
                    <Image
                      src={resolvedHero}
                      alt=""
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                  </div>
                )}
                {accent2 && (
                  <div className="absolute -bottom-6 -left-6 h-36 w-36 overflow-hidden rounded-3xl shadow-xl ring-[6px] ring-white">
                    <Image
                      src={accent2}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  </div>
                )}
                {accent3 && (
                  <div className="absolute -right-8 top-4 h-24 w-24 overflow-hidden rounded-full shadow-xl ring-[6px] ring-white">
                    <Image
                      src={accent3}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-nav for the Empresa / related pages */}
      {current && (
        <nav
          aria-label="Secciones"
          className="sticky top-16 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-lg"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            {SUBNAV.map((item) => {
              const active = item.slug === current;
              const Icon = item.icon;
              return (
                <Link
                  key={item.slug}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.es}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Body */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        {sections && sections.length > 0 ? (
          <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
            <aside className="hidden lg:block">
              <div className="sticky top-32 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  En esta página
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
            <div>{children}</div>
          </div>
        ) : (
          <div>{children}</div>
        )}
      </section>
    </main>
  );
}
