import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auditoria | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminAuditoriaPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Auditoria
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Registro de acciones administrativas y cambios en el sistema.
        </p>
      </div>

      <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
        <svg className="mx-auto mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">
          Sin registros de auditoria
        </h2>
        <p className="mx-auto max-w-md text-sm text-slate-500">
          Los registros de auditoria se generan automaticamente cuando se realizan acciones administrativas como
          editar lugares, modificar planes o importar datos. Conecta la base de datos para ver los registros.
        </p>
      </div>
    </div>
  );
}
