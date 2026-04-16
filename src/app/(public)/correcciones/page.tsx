import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Correcciones | Rutas en MX',
  description:
    'Registro de correcciones y actualizaciones importantes en la informacion de Rutas en MX.',
  alternates: { canonical: 'https://rutasenmx.com/correcciones' },
};

export default function CorreccionesPage() {
  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Correcciones', href: '/correcciones' },
  ];

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900">
        Correcciones
      </h1>
      <div className="prose prose-zinc max-w-none">
        <p>
          Nos esforzamos por mantener informacion precisa y actualizada. Cuando
          identificamos errores, los corregimos y documentamos aqui.
        </p>

        <h2>Reportar un error</h2>
        <p>
          Si encuentras informacion incorrecta, desactualizada o que infringe
          derechos de autor, por favor{' '}
          <Link href="/contacto">contactanos</Link>. Revisaremos tu reporte y
          actualizaremos la informacion lo antes posible.
        </p>

        <h2>Historial de correcciones</h2>
        <p className="text-zinc-500">
          Aun no hay correcciones registradas. Esta seccion se actualizara conforme
          se realicen correcciones importantes en el contenido del sitio.
        </p>
      </div>
    </main>
  );
}
