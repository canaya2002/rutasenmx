import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Politica editorial | Rutas en MX',
  description:
    'Nuestra politica editorial: como creamos contenido de calidad, atribuimos fuentes y manejamos contenido patrocinado.',
  alternates: { canonical: 'https://rutasenmx.com/politica-editorial' },
};

export default function PoliticaEditorialPage() {
  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Politica editorial', href: '/politica-editorial' },
  ];

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900">
        Politica editorial
      </h1>
      <div className="prose prose-zinc max-w-none">
        <p>
          Rutas en MX se compromete a ofrecer informacion util, precisa y honesta
          para viajeros en Mexico. Esta politica describe como creamos y gestionamos
          nuestro contenido.
        </p>

        <h2>Independencia editorial</h2>
        <p>
          Nuestras recomendaciones de rutas, lugares y destinos se basan en datos
          oficiales, calidad del lugar y relevancia para el viajero. Las
          recomendaciones editoriales no estan influenciadas por relaciones
          comerciales.
        </p>

        <h2>Contenido patrocinado</h2>
        <p>
          Cuando un lugar o contenido es patrocinado, se indica claramente con una
          etiqueta &ldquo;Patrocinado&rdquo;. Los patrocinios no alteran las
          calificaciones ni las posiciones organicas en listados no patrocinados.
        </p>

        <h2>Afiliados</h2>
        <p>
          Rutas en MX puede recibir comisiones por reservas realizadas a traves de
          enlaces de afiliados (hospedaje, tours, etc.). Esto no tiene costo adicional
          para el usuario y no influye en nuestras recomendaciones editoriales.
        </p>

        <h2>Atribucion de fuentes</h2>
        <p>
          Siempre atribuimos la fuente original de los datos. Consulta nuestras{' '}
          <Link href="/fuentes-de-datos">fuentes de datos</Link> y{' '}
          <Link href="/metodologia">metodologia</Link> para mas detalles.
        </p>

        <h2>Correcciones</h2>
        <p>
          Si detectamos un error en nuestro contenido, lo corregimos de forma
          transparente. Consulta nuestra pagina de{' '}
          <Link href="/correcciones">correcciones</Link>.
        </p>
      </div>
    </main>
  );
}
