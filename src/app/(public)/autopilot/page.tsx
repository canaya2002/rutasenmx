import type { Metadata } from 'next';
import Link from 'next/link';
import { AutopilotWizard } from '@/components/ai/AutopilotWizard';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { pickDecorations } from '@/lib/data/general-images';
import { DecorBlob } from '@/components/decor/DecorImage';
import Image from 'next/image';
import {
  Sparkles,
  Zap,
  Clock,
  Shield,
  MapPin,
  Wand2,
  Route as RouteIcon,
  Compass,
  ArrowRight,
} from 'lucide-react';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Autopilot · Planea tu viaje por México con IA',
    description:
      'Deja que nuestra IA diseñe tu ruta perfecta por México. Define origen, destino, fechas, ritmo y presupuesto — recibe un itinerario con paradas, mapa y costos en segundos.',
    path: '/autopilot',
    keywords: [
      'planear viaje con IA',
      'Autopilot Rutas en MX',
      'generador de itinerarios México',
      'IA viajes México',
      'plan automático ruta',
    ],
  });
}

const STEPS = [
  { icon: MapPin,    title: 'Cuéntanos a dónde', desc: 'Origen, destino y fechas (opcionales).' },
  { icon: Wand2,     title: 'Define tu estilo',    desc: 'Ritmo, presupuesto, intereses y must-visit.' },
  { icon: RouteIcon, title: 'Recibe tu ruta',      desc: 'Paradas verificadas con mapa y costos.' },
];

export default function AutopilotPage() {
  const decor = pickDecorations('autopilot-hero', 5);

  return (
    <main className="bg-gradient-to-b from-slate-50 via-white to-white">
      {/* ─────────── HERO with motion ─────────── */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-emerald-50/30 to-white">
        {/* Floating gradient orbs */}
        <DecorBlob color="bg-emerald-300/40" className="animate-floaty -right-40 -top-40 h-[32rem] w-[32rem]" />
        <DecorBlob color="bg-sky-200/30" className="animate-floaty [animation-delay:-3s] -left-32 bottom-0 h-96 w-96" />
        <DecorBlob color="bg-amber-200/20" className="animate-floaty [animation-delay:-6s] right-1/4 top-1/3 h-64 w-64" />

        {/* Orbiting decoration circles */}
        {decor[0] && (
          <div className="pointer-events-none absolute right-10 top-14 hidden lg:block" aria-hidden>
            <div className="animate-floaty relative h-32 w-32 overflow-hidden rounded-full shadow-2xl ring-[6px] ring-white">
              <Image src={decor[0]} alt="" fill sizes="140px" className="object-cover" />
            </div>
          </div>
        )}
        {decor[1] && (
          <div className="pointer-events-none absolute bottom-24 right-56 hidden xl:block" aria-hidden>
            <div className="animate-floaty [animation-delay:-2s] relative h-24 w-24 overflow-hidden rounded-[32%_68%_56%_44%/48%_60%_40%_52%] shadow-xl ring-[6px] ring-white">
              <Image src={decor[1]} alt="" fill sizes="100px" className="object-cover" />
            </div>
          </div>
        )}
        {decor[2] && (
          <div className="pointer-events-none absolute left-12 top-24 hidden lg:block" aria-hidden>
            <div className="animate-floaty [animation-delay:-4s] relative h-20 w-20 overflow-hidden rounded-3xl shadow-xl ring-[6px] ring-white rotate-[-6deg]">
              <Image src={decor[2]} alt="" fill sizes="96px" className="object-cover" />
            </div>
          </div>
        )}
        {decor[3] && (
          <div className="pointer-events-none absolute bottom-10 left-16 hidden xl:block" aria-hidden>
            <div className="animate-floaty [animation-delay:-5s] relative h-28 w-28 overflow-hidden rounded-full shadow-xl ring-[6px] ring-white rotate-[5deg]">
              <Image src={decor[3]} alt="" fill sizes="120px" className="object-cover" />
            </div>
          </div>
        )}

        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          {/* Animated live-status pill */}
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Autopilot · IA en vivo
          </span>

          <h1 className="animate-fade-up mx-auto mt-6 max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Tu ruta perfecta por México,
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 bg-clip-text text-transparent">
              en segundos
            </span>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-balance text-lg leading-8 text-slate-600">
            Cuéntale a Autopilot dónde empiezas, a dónde vas, cuántos días tienes y tu estilo —
            te entrega un itinerario con paradas verificadas, mapa y costos estimados.
          </p>

          {/* Trust chips */}
          <div className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-sm">
            {[
              { icon: Zap,    label: '< 30 s' },
              { icon: Clock,  label: '10 pasos' },
              { icon: Shield, label: 'Sólo lugares verificados' },
              { icon: Compass, label: '32 estados cubiertos' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
              >
                <Icon className="h-4 w-4 text-emerald-600 transition group-hover:scale-110" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── HOW IT WORKS ─────────── */}
      <section className="mx-auto max-w-5xl px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Cómo funciona
        </p>
        <h2 className="mx-auto mt-2 max-w-xl text-balance text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Tres pasos y un itinerario listo para salir
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className={`reveal-stagger-${i + 1} group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl`}
            >
              <span
                className="absolute right-5 top-4 text-5xl font-black text-slate-100 transition group-hover:text-emerald-100"
                aria-hidden
              >
                0{i + 1}
              </span>
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md ring-4 ring-emerald-100 transition group-hover:rotate-[-4deg] group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="relative mt-5 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="relative mt-1.5 text-sm leading-6 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── WIZARD ─────────── */}
      <section className="relative mx-auto mt-6 max-w-4xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-[1] flex items-center justify-center">
          <div className="h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        </div>
        <div className="animate-fade-up rounded-[32px] border border-white/70 bg-white/85 p-2 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.3)] ring-1 ring-black/5 backdrop-blur-xl sm:p-4">
          <AutopilotWizard />
        </div>
      </section>

      {/* ─────────── FINAL CTA ─────────── */}
      <section className="mx-auto max-w-4xl px-4 pb-20 text-center sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-8 text-white shadow-xl sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            ¿No quieres llenar el formulario?
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Arma tu ruta a mano en el planificador</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-200">
            Control total: origen, destino, paradas, casetas y gasolina — todo en un mapa interactivo.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/planear"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-emerald-300"
            >
              Abrir planificador
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/rutas"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver rutas curadas
            </Link>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Tus datos son privados. Lee nuestra{' '}
          <Link href="/privacidad" className="text-emerald-700 hover:underline">
            política de privacidad
          </Link>{' '}
          y{' '}
          <Link href="/metodologia" className="text-emerald-700 hover:underline">
            metodología
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
