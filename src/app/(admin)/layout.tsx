import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/lugares', label: 'Lugares' },
  { href: '/admin/categorias', label: 'Categorias' },
  { href: '/admin/importaciones', label: 'Importaciones' },
  { href: '/admin/planes', label: 'Planes' },
  { href: '/admin/deals', label: 'Deals' },
  { href: '/admin/feature-flags', label: 'Feature Flags' },
  { href: '/admin/auditoria', label: 'Auditoria' },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/iniciar-sesion');
  }
  if (session.role !== 'admin') {
    redirect('/mis-viajes');
  }

  return (
    <div className="flex min-h-screen">
      {/* Admin sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-slate-950 lg:block">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm text-white">
              A
            </span>
            Admin
          </Link>
        </div>
        <nav className="p-4" aria-label="Admin">
          <ul className="space-y-0.5">
            {ADMIN_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto border-t border-slate-800 p-4">
          <Link
            href="/"
            className="block text-sm text-slate-400 transition hover:text-white"
          >
            Volver al sitio
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="lg:hidden">
            <Link href="/admin" className="text-lg font-bold text-slate-900">
              Admin
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-500">
              Admin
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-sm font-medium text-red-700">
              A
            </div>
          </div>
        </header>

        {/* Mobile navigation */}
        <nav className="flex overflow-x-auto border-b border-slate-200 bg-white px-4 lg:hidden" aria-label="Admin mobile">
          {ADMIN_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
