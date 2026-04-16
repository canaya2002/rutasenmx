import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feature Flags | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminFeatureFlagsPage() {
  const flags = [
    { key: 'FEATURE_MOTORCYCLE', label: 'Soporte para motocicleta', enabled: !!process.env.FEATURE_MOTORCYCLE },
    { key: 'FEATURE_CAMPERVAN', label: 'Soporte para campervan', enabled: !!process.env.FEATURE_CAMPERVAN },
    { key: 'FEATURE_RV', label: 'Soporte para RV', enabled: !!process.env.FEATURE_RV },
    { key: 'FEATURE_ROADSIDE_ASSIST', label: 'Asistencia en carretera', enabled: !!process.env.FEATURE_ROADSIDE_ASSIST },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Feature Flags
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Controla funcionalidades experimentales y opcionales de la plataforma.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-900">Flag</th>
              <th className="px-4 py-3 font-semibold text-slate-900">Descripcion</th>
              <th className="px-4 py-3 font-semibold text-slate-900">Estado</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.key} className="border-b border-slate-100">
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{flag.key}</td>
                <td className="px-4 py-3 text-slate-600">{flag.label}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      flag.enabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {flag.enabled ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Los feature flags se controlan mediante variables de entorno. Reinicia el servidor despues de modificarlas.
      </p>
    </div>
  );
}
