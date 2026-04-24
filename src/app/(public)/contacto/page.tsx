import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getLocale } from '@/lib/i18n/server';
import { PageShell } from '@/components/layout/PageShell';
import { Mail, MessageSquare, Newspaper, Shield, Briefcase, AlertTriangle } from 'lucide-react';

const PAGE_PATH = '/contacto';
const PAGE_TITLE = 'Contacto';
const PAGE_DESCRIPTION =
  'Escríbele al equipo editorial, comercial, legal y técnico de Rutas en MX. Sabemos qué buzón responde más rápido según tu mensaje.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
  });
}

interface ContactChannel {
  icon: typeof Mail;
  label: string;
  email: string;
  purpose: string;
  sla: string;
  tint: string;
}

const CHANNELS_ES: ContactChannel[] = [
  { icon: Newspaper,     label: 'Redacción editorial', email: 'editorial@rutasenmx.com',    purpose: 'Pitch de historias, colaboraciones editoriales, correcciones.', sla: 'Respuesta en 5 días hábiles.', tint: 'from-emerald-500 to-emerald-700' },
  { icon: AlertTriangle, label: 'Correcciones',        email: 'correcciones@rutasenmx.com', purpose: 'Reportar un dato incorrecto o desactualizado en cualquier página.', sla: 'Acuse en 48 h, corrección en 7 días.', tint: 'from-amber-500 to-amber-700' },
  { icon: Shield,        label: 'Privacidad y legal',  email: 'legal@rutasenmx.com',        purpose: 'Solicitudes ARCO, incidentes de privacidad, temas legales.', sla: 'Respuesta en 10 días hábiles.', tint: 'from-slate-800 to-slate-950' },
  { icon: Briefcase,     label: 'Alianzas y prensa',   email: 'partners@rutasenmx.com',     purpose: 'Acuerdos comerciales, afiliados, sponsorships, prensa.', sla: 'Respuesta en 3 días hábiles.', tint: 'from-sky-500 to-sky-700' },
  { icon: MessageSquare, label: 'Soporte general',     email: 'hola@rutasenmx.com',         purpose: 'Dudas sobre uso, cuenta, suscripción o feedback general.', sla: 'Respuesta en 2 días hábiles.', tint: 'from-violet-500 to-violet-700' },
  { icon: Mail,          label: 'Todo lo demás',       email: 'hola@rutasenmx.com',         purpose: '¿No estás seguro? Escríbenos y redirigimos al buzón correcto.', sla: 'Respuesta en 2 días hábiles.', tint: 'from-rose-500 to-rose-700' },
];

const CHANNELS_EN: ContactChannel[] = [
  { icon: Newspaper,     label: 'Editorial desk',      email: 'editorial@rutasenmx.com',    purpose: 'Story pitches, editorial collaborations, corrections.', sla: 'Reply within 5 business days.', tint: 'from-emerald-500 to-emerald-700' },
  { icon: AlertTriangle, label: 'Corrections',         email: 'correcciones@rutasenmx.com', purpose: 'Report incorrect or outdated information on any page.', sla: 'Ack within 48h, fix in 7 days.', tint: 'from-amber-500 to-amber-700' },
  { icon: Shield,        label: 'Privacy & legal',     email: 'legal@rutasenmx.com',        purpose: 'ARCO requests, privacy incidents, legal matters.', sla: 'Reply within 10 business days.', tint: 'from-slate-800 to-slate-950' },
  { icon: Briefcase,     label: 'Partnerships & press',email: 'partners@rutasenmx.com',     purpose: 'Commercial deals, affiliate setups, sponsorships, press.', sla: 'Reply within 3 business days.', tint: 'from-sky-500 to-sky-700' },
  { icon: MessageSquare, label: 'General support',     email: 'hola@rutasenmx.com',         purpose: 'Questions about usage, accounts, subscriptions or feedback.', sla: 'Reply within 2 business days.', tint: 'from-violet-500 to-violet-700' },
  { icon: Mail,          label: 'Anything else',       email: 'hola@rutasenmx.com',         purpose: 'Not sure? Write to us and we will route you.', sla: 'Reply within 2 business days.', tint: 'from-rose-500 to-rose-700' },
];

export default async function ContactoPage() {
  const locale = await getLocale();
  const isEn = locale === 'en';  const channels = isEn ? CHANNELS_EN : CHANNELS_ES;

  return (
    <PageShell
      title={isEn ? 'Contact us' : 'Contáctanos'}
      kicker={isEn ? 'Company · Contact' : 'Empresa · Contacto'}
      summary={
        isEn
          ? 'Pick the right inbox so we can reply faster. Every channel has its own response window.'
          : 'Elige el buzón adecuado y te respondemos más rápido. Cada canal tiene su propio tiempo de respuesta.'
      }
      decorKey="contacto"
      current="contacto"
      accent="violet"
      stats={[
        { value: '48 h', label: isEn ? 'Corrections ack' : 'Acuse correcciones' },
        { value: '2 d',  label: isEn ? 'General support' : 'Soporte general' },
        { value: '10 d', label: isEn ? 'Legal requests'  : 'Solicitudes legales' },
        { value: '5 d',  label: isEn ? 'Editorial pitches' : 'Pitch editorial' },
      ]}
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {isEn ? 'Which inbox fits your message?' : '¿Qué buzón va con tu mensaje?'}
        </h2>
        <p className="mt-2 leading-7 text-slate-600">
          {isEn
            ? 'Routing correctly helps us reply faster — every inbox is monitored by the team that can help.'
            : 'Elegir el canal correcto nos ayuda a responder más rápido — cada buzón lo monitorea el equipo que puede ayudarte.'}
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {channels.map(({ icon: Icon, label, email, purpose, sla, tint }) => (
            <a
              key={email + label}
              href={`mailto:${email}`}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div aria-hidden className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${tint} opacity-10 blur-2xl transition group-hover:opacity-20`} />
              <div className="relative flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tint} text-white shadow-md`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="font-mono text-xs text-emerald-700">{email}</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-600">{purpose}</p>
              <p className="text-xs font-medium text-slate-500">{sla}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {isEn ? 'Response & privacy' : 'Tiempos y privacidad'}
        </h2>
        <ul className="mt-5 list-disc space-y-2 pl-6 leading-7 text-slate-600 marker:text-violet-500">
          <li>{isEn ? 'We read and classify every message within 48 hours.' : 'Leemos y clasificamos cada mensaje en 48 horas.'}</li>
          <li>{isEn ? 'Messages carry the privacy commitments described in our Privacy Policy.' : 'Los mensajes se tratan según los compromisos de nuestra Política de Privacidad.'}</li>
          <li>{isEn ? 'Urgent safety issues (road closures, active incidents) are prioritised.' : 'Los asuntos urgentes de seguridad (cierres de carretera, incidentes) tienen prioridad.'}</li>
          <li>{isEn ? 'We never ask for passwords, payment details or sensitive data by email.' : 'Nunca pedimos contraseñas, datos de pago ni información sensible por correo.'}</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/privacidad"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {isEn ? 'Privacy policy' : 'Política de privacidad'} →
          </Link>
          <Link
            href="/politica-editorial"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {isEn ? 'Editorial policy' : 'Política editorial'} →
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
