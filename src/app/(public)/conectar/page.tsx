import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin,
  Heart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  MessageSquare,
} from 'lucide-react';

import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildBreadcrumbSchema,
  buildWebPageSchema,
  buildFAQSchema,
  buildGraph,
} from '@/lib/seo/schema';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { optionalAuth } from '@/lib/auth/middleware';
import { canAccess } from '@/lib/subscription/plans';
import { getSocialProfile } from '@/lib/social/profile';

const PAGE_TITLE = 'Conectar: encuentra viajeros que van a tu destino';
const PAGE_DESCRIPTION =
  'Descubre, haz match y chatea con otras personas que viajan a los mismos estados de México que tú. Exclusivo Premium.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: '/conectar',
    keywords: [
      'conocer viajeros México',
      'conectar road trip México',
      'social travel México',
      'match viaje México',
      'encontrar amigos de viaje',
    ],
  });
}

export default async function ConectarLandingPage() {
  const session = await optionalAuth();
  const hasAccess = session ? canAccess(session.plan, 'social_connect') : false;
  const hasProfile = hasAccess && session
    ? !!(await getSocialProfile(session.userId))
    : false;

  const primaryHref = !session
    ? '/registrarse?next=/conectar'
    : !hasAccess
      ? '/suscripcion?feature=social_connect'
      : hasProfile
        ? '/conectar/descubrir'
        : '/conectar/perfil';

  const primaryLabel = !session
    ? 'Empezar gratis'
    : !hasAccess
      ? 'Activar Premium'
      : hasProfile
        ? 'Ir a descubrir'
        : 'Crear mi perfil social';

  const graph = buildGraph([
    buildWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, '/conectar'),
    buildBreadcrumbSchema(
      buildBreadcrumbs([{ label: 'Conectar', href: '/conectar' }]),
    ),
    buildFAQSchema([
      {
        question: '¿Cómo funciona Conectar?',
        answer:
          'Creas un perfil social con tus intereses y el estado al que vas. Luego descubres viajeros compatibles con vista tipo swipe. Cuando ambos dan like, se habilita el chat.',
      },
      {
        question: '¿Necesito pagar para usar Conectar?',
        answer:
          'Sí. Conectar es exclusivo del plan Premium. Incluye perfil social, descubrimiento, matches, chat y acceso a foros y grupos.',
      },
      {
        question: '¿Qué tan seguro es?',
        answer:
          'Todas las fotos pasan un filtro automático antes de publicarse. Puedes bloquear o reportar a cualquier usuario, y tus datos siempre están controlados por ti.',
      },
      {
        question: '¿Puedo ocultar mi perfil?',
        answer:
          'Sí, con un interruptor en tu perfil lo haces invisible en descubrimiento sin borrar nada.',
      },
    ]),
  ]);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 py-20 text-white">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-400/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-teal-400/30 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ring-1 ring-white/20 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            Premium · Nuevo
          </span>
          <h1 className="mt-5 text-balance text-5xl font-extrabold tracking-tight drop-shadow sm:text-6xl">
            Viaja mejor cuando no viajas solo
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-8 text-emerald-50">
            Conecta con otras personas que también van a tu destino en México.
            Haz match, chatea, y convierte tu road trip en una experiencia
            compartida.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-emerald-700 shadow-lg transition hover:scale-105 hover:bg-emerald-50"
            >
              <Heart className="h-4 w-4" fill="currentColor" />
              {primaryLabel}
            </Link>
            <Link
              href="/precios"
              className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/10"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </section>

      {/* ¿Cómo funciona? */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          Así funciona
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Step
            icon={Users}
            title="1. Crea tu perfil"
            body="Foto, bio, el estado al que vas e intereses. En menos de 1 minuto."
          />
          <Step
            icon={MapPin}
            title="2. Descubre"
            body="Ve perfiles de viajeros que comparten tu ruta. Filtra por estado e intención."
          />
          <Step
            icon={Heart}
            title="3. Haz match"
            body="Like mutuo abre la conversación. Sin ghosting raros, sin juegos."
          />
          <Step
            icon={MessageCircle}
            title="4. Conoce en persona"
            body="Chatea en la app, arma planes y conviértelo en memoria."
          />
        </div>
      </section>

      {/* Seguridad */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <ShieldCheck className="mx-auto h-10 w-10 text-emerald-600" />
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            Una comunidad segura
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
            Bloqueo con un toque, reporte discreto, control total sobre tu
            visibilidad. Solo usuarios verificados con plan Premium.
          </p>
        </div>
      </section>

      {/* Comunidad preview */}
      {hasAccess && (
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-white p-8 sm:p-12">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                  <MessageSquare className="h-3 w-3" />
                  Nuevo
                </span>
                <h2 className="mt-3 text-3xl font-bold text-slate-900">
                  Comunidad: foros, grupos y canales
                </h2>
                <p className="mt-3 text-base text-slate-600">
                  Comparte experiencias de comida, rutas y lugares. Únete a foros
                  editoriales o crea tu propio grupo privado. Todas las fotos se
                  revisan automáticamente.
                </p>
              </div>
              <Link
                href="/comunidad"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700"
              >
                Entrar a la comunidad
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900">
          Listo para encontrar a tu siguiente compañero de ruta
        </h2>
        <p className="mt-3 text-base text-slate-600">
          Exclusivo para miembros Premium.
        </p>
        <Link
          href={primaryHref}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700"
        >
          {primaryLabel}
        </Link>
      </section>
    </main>
  );
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Users;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
