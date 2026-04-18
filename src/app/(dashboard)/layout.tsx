import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getTranslations } from '@/lib/i18n/server';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function SidebarIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'map':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    case 'heart':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case 'user':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'credit-card':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    default:
      return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/iniciar-sesion');
  }

  const t = await getTranslations();
  const SIDEBAR_LINKS = [
    { href: '/mis-viajes', label: t.common.myTrips, icon: 'map' },
    { href: '/favoritos', label: t.common.favorites, icon: 'heart' },
    { href: '/perfil', label: t.common.profile, icon: 'user' },
    { href: '/suscripcion', label: t.common.subscription, icon: 'credit-card' },
  ] as const;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-sm text-white">
              R
            </span>
            Rutas en MX
          </Link>
        </div>
        <nav className="p-4" aria-label="Dashboard">
          <ul className="space-y-1">
            {SIDEBAR_LINKS.map(({ href, label, icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <SidebarIcon icon={icon} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Dashboard header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-4 lg:hidden">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold text-slate-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-sm text-white">
                R
              </span>
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
              {session.role === 'admin' ? 'A' : 'U'}
            </div>
          </div>
        </header>

        {/* Mobile navigation */}
        <nav className="flex border-b border-slate-200 bg-white px-4 lg:hidden" aria-label="Dashboard mobile">
          <div className="flex gap-1 overflow-x-auto">
            {SIDEBAR_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
