import type { Metadata } from 'next';
import Link from 'next/link';
import { and, desc, gte, sql } from 'drizzle-orm';

import { db, analyticsEvents, users } from '@/db';

export const metadata: Metadata = {
  title: 'Analytics · Admin',
  robots: { index: false, follow: false },
};

const RANGE_DAYS: Record<string, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

interface Props {
  searchParams: Promise<{ range?: string; name?: string }>;
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const params = await searchParams;
  const rangeKey = params.range && RANGE_DAYS[params.range] ? params.range : '7d';
  const rangeDays = RANGE_DAYS[rangeKey];
  const cutoff = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);
  const nameFilter = params.name?.trim() || null;

  // ── Aggregated metrics ───────────────────────────────────────────────────
  // Pre-computed SQL so we don't hammer the DB with one query per card.
  const timeFilter = gte(analyticsEvents.createdAt, cutoff);
  const whereClauses = nameFilter
    ? [timeFilter, sql`${analyticsEvents.name} = ${nameFilter}`]
    : [timeFilter];

  const [totals] = await db
    .select({
      totalEvents: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct ${analyticsEvents.userId})::int`,
      uniqueSessions: sql<number>`count(distinct ${analyticsEvents.sessionId})::int`,
    })
    .from(analyticsEvents)
    .where(and(...whereClauses));

  const byName = await db
    .select({
      name: analyticsEvents.name,
      total: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct ${analyticsEvents.userId})::int`,
    })
    .from(analyticsEvents)
    .where(timeFilter)
    .groupBy(analyticsEvents.name)
    .orderBy(desc(sql`count(*)`))
    .limit(40);

  // Daily series for a sparkline-ish view (no chart lib; just bars in CSS).
  const byDay = await db.execute(sql`
    SELECT
      date_trunc('day', created_at) AS day,
      count(*)::int AS total
    FROM analytics_events
    WHERE created_at >= ${cutoff}
      ${nameFilter ? sql`AND name = ${nameFilter}` : sql``}
    GROUP BY 1
    ORDER BY 1 ASC
  `);
  const dailyRows = (byDay as unknown as Array<{ day: Date | string; total: number }>).map(
    (r) => ({
      day: new Date(r.day as string).toISOString().slice(0, 10),
      total: Number(r.total),
    }),
  );
  const maxDailyTotal = dailyRows.reduce((m, r) => Math.max(m, r.total), 0) || 1;

  // Recent stream (last 100 events joined to user email when available).
  const recent = await db
    .select({
      id: analyticsEvents.id,
      name: analyticsEvents.name,
      userId: analyticsEvents.userId,
      email: users.email,
      properties: analyticsEvents.properties,
      createdAt: analyticsEvents.createdAt,
    })
    .from(analyticsEvents)
    .leftJoin(users, sql`${users.id} = ${analyticsEvents.userId}`)
    .where(and(...whereClauses))
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(100);

  // ── Top funnel call-outs ─────────────────────────────────────────────────
  const eventMap = new Map<string, (typeof byName)[number]>();
  for (const row of byName) eventMap.set(row.name, row);
  const signups = eventMap.get('signup_completed')?.total ?? 0;
  const autopilot = eventMap.get('autopilot_run')?.total ?? 0;
  const tripsCreated = eventMap.get('trip_created')?.total ?? 0;
  const tripsFromAi = eventMap.get('trip_saved_from_autopilot')?.total ?? 0;
  const checkoutStarted = eventMap.get('checkout_started')?.total ?? 0;
  const checkoutCompleted = eventMap.get('checkout_completed')?.total ?? 0;
  const matches = eventMap.get('match_created')?.total ?? 0;
  const messages = eventMap.get('message_sent')?.total ?? 0;

  const checkoutConversion =
    checkoutStarted > 0 ? (checkoutCompleted / checkoutStarted) * 100 : 0;
  const autopilotSaveRate =
    autopilot > 0 ? (tripsFromAi / autopilot) * 100 : 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500">
            Eventos registrados en los últimos{' '}
            <strong>{rangeDays}</strong> días
            {nameFilter ? (
              <>
                {' '}
                · filtrando por <code>{nameFilter}</code>
              </>
            ) : null}
            .
          </p>
        </div>
        <div className="flex gap-1">
          {Object.keys(RANGE_DAYS).map((k) => (
            <Link
              key={k}
              href={`/admin/analytics?range=${k}${nameFilter ? `&name=${encodeURIComponent(nameFilter)}` : ''}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                k === rangeKey
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {k}
            </Link>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Eventos totales" value={totals?.totalEvents ?? 0} />
        <StatCard label="Usuarios únicos" value={totals?.uniqueUsers ?? 0} />
        <StatCard label="Sesiones únicas" value={totals?.uniqueSessions ?? 0} />
      </div>

      {/* Funnel call-outs */}
      <div className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Funnel</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Signups" value={signups} />
          <MiniStat label="Autopilot runs" value={autopilot} />
          <MiniStat label="Trips creados" value={tripsCreated} />
          <MiniStat label="Guardados desde IA" value={tripsFromAi} />
          <MiniStat label="Checkout iniciado" value={checkoutStarted} />
          <MiniStat
            label="Checkout completado"
            value={checkoutCompleted}
            accent={checkoutCompleted > 0}
          />
          <MiniStat label="Matches" value={matches} />
          <MiniStat label="Mensajes" value={messages} />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
          <span>
            Conversión checkout:{' '}
            <strong className="text-slate-900">
              {checkoutConversion.toFixed(1)}%
            </strong>
          </span>
          <span>
            Save-rate Autopilot:{' '}
            <strong className="text-slate-900">
              {autopilotSaveRate.toFixed(1)}%
            </strong>
          </span>
        </div>
      </div>

      {/* Daily bars */}
      <div className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Por día</h2>
        {dailyRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Sin eventos en el rango.
          </p>
        ) : (
          <div className="flex items-end gap-1 rounded-xl border border-slate-200 bg-white p-4">
            {dailyRows.map((r) => (
              <div key={r.day} className="flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t bg-emerald-500"
                  style={{
                    height: `${Math.max(4, (r.total / maxDailyTotal) * 120)}px`,
                  }}
                  title={`${r.day}: ${r.total}`}
                />
                <span className="mt-1 text-[9px] tabular-nums text-slate-500">
                  {r.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Breakdown by name */}
      <div className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Por evento
        </h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Evento</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-right">Usuarios únicos</th>
                <th className="px-4 py-2 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byName.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    Sin eventos aún en este rango.
                  </td>
                </tr>
              ) : (
                byName.map((row) => (
                  <tr key={row.name}>
                    <td className="px-4 py-2 font-mono text-xs">{row.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.total.toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.uniqueUsers.toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/admin/analytics?range=${rangeKey}&name=${encodeURIComponent(row.name)}`}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        filtrar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {nameFilter && (
          <Link
            href={`/admin/analytics?range=${rangeKey}`}
            className="mt-2 inline-block text-xs text-slate-500 hover:text-slate-900"
          >
            ← limpiar filtro
          </Link>
        )}
      </div>

      {/* Recent stream */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Últimos 100 eventos
        </h2>
        <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Evento</th>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Properties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    Vacío.
                  </td>
                </tr>
              ) : (
                recent.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                      {new Date(r.createdAt).toLocaleString('es-MX', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono">
                      {r.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {r.email ?? (r.userId ? `${r.userId.slice(0, 8)}…` : '—')}
                    </td>
                    <td className="max-w-[420px] px-3 py-2 font-mono text-[11px] text-slate-500">
                      {r.properties
                        ? truncate(JSON.stringify(r.properties), 140)
                        : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
        {value.toLocaleString('es-MX')}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        accent
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-bold tabular-nums ${
          accent ? 'text-emerald-700' : 'text-slate-900'
        }`}
      >
        {value.toLocaleString('es-MX')}
      </p>
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}
