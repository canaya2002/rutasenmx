import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Metodologia | Rutas en MX',
  description:
    'Como recopilamos, normalizamos y clasificamos la informacion de lugares, rutas y destinos en Rutas en MX.',
  alternates: { canonical: 'https://rutasenmx.com/metodologia' },
};

export default function MetodologiaPage() {
  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Metodologia', href: '/metodologia' },
  ];

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900">
        Metodologia
      </h1>
      <div className="prose prose-zinc max-w-none">
        <p>
          En Rutas en MX seguimos un proceso riguroso para garantizar la calidad y
          confiabilidad de la informacion que presentamos.
        </p>

        <h2>Recopilacion de datos</h2>
        <p>
          Utilizamos importadores automatizados e idempotentes que extraen datos de
          fuentes oficiales como SECTUR, INAH, SIC Cultura e INEGI. Cada ejecucion
          registra metricas, errores y un hash de la fuente para detectar cambios.
        </p>

        <h2>Normalizacion</h2>
        <p>
          Los datos pasan por una tuberia de normalizacion que estandariza nombres,
          estados, municipios, categorias y coordenadas geograficas. Usamos
          deduplicacion multi-fuente basada en nombre, distancia geografica, categoria
          y datos de contacto.
        </p>

        <h2>Clasificacion y taxonomia</h2>
        <p>
          Cada lugar se asigna a una o mas categorias de nuestra taxonomia turistica:
          Pueblos Magicos, museos, zonas arqueologicas, playas, cenotes, haciendas,
          y mas de 25 categorias adicionales. Los badges como &ldquo;Pueblo Magico
          Oficial&rdquo; o &ldquo;Sitio INAH&rdquo; se asignan solo cuando la fuente
          oficial lo respalda.
        </p>

        <h2>Puntuacion de calidad</h2>
        <p>
          Cada lugar recibe un &ldquo;richness score&rdquo; basado en la completitud
          de sus datos: descripcion, coordenadas, imagenes, horarios, contacto y
          lugares relacionados. Solo las paginas que superan un umbral minimo se
          indexan en buscadores.
        </p>

        <h2>Actualizacion continua</h2>
        <p>
          Los importadores se ejecutan periodicamente para mantener los datos
          actualizados. Cuando detectamos discrepancias entre fuentes, el sistema
          marca conflictos para revision manual.
        </p>

        <h2>Transparencia</h2>
        <p>
          Siempre indicamos la fuente y fecha de actualizacion de los datos. Puedes
          consultar las <Link href="/fuentes-de-datos">fuentes de datos</Link>{' '}
          completas o <Link href="/contacto">reportar un error</Link>.
        </p>
      </div>
    </main>
  );
}
