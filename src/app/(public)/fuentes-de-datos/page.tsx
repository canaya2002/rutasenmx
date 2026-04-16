import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Fuentes de datos | Rutas en MX',
  description:
    'Conoce las fuentes oficiales y publicas que alimentan la informacion de Rutas en MX: SECTUR, INAH, SIC Cultura, INEGI y mas.',
  alternates: { canonical: 'https://rutasenmx.com/fuentes-de-datos' },
};

export default function FuentesDeDatosPage() {
  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: 'Fuentes de datos', href: '/fuentes-de-datos' },
  ];

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900">
        Fuentes de datos
      </h1>
      <div className="prose prose-zinc max-w-none">
        <p>
          Rutas en MX recopila, normaliza y presenta informacion de fuentes oficiales
          y publicas de Mexico. Nuestro compromiso es ofrecer datos confiables y
          siempre atribuir correctamente las fuentes.
        </p>

        <h2>Fuentes oficiales</h2>
        <ul>
          <li>
            <strong>SECTUR</strong> - Secretaria de Turismo del Gobierno de Mexico.
            Fuente principal para el catalogo de Pueblos Magicos y el Atlas Turistico.
          </li>
          <li>
            <strong>SIC - Sistema de Informacion Cultural</strong> - Secretaria de
            Cultura. Directorio abierto de museos de Mexico con coordenadas, contacto
            y tematica.
          </li>
          <li>
            <strong>INAH</strong> - Instituto Nacional de Antropologia e Historia.
            Datos abiertos de zonas arqueologicas y sitios patrimoniales.
          </li>
          <li>
            <strong>INEGI</strong> - Instituto Nacional de Estadistica y Geografia.
            API de ruteo para calcular distancias, tiempos, peajes y combustible.
          </li>
          <li>
            <strong>DataTur / RNT</strong> - Registro Nacional de Turismo. Validacion
            de prestadores turisticos.
          </li>
        </ul>

        <h2>Datos de terceros</h2>
        <ul>
          <li>
            <strong>Mapbox</strong> - Mapas interactivos, geocodificacion y capas de
            navegacion.
          </li>
          <li>
            <strong>Booking.com</strong> - Busqueda y disponibilidad de hospedaje
            mediante API de afiliados.
          </li>
        </ul>

        <h2>Datos editoriales</h2>
        <p>
          Las descripciones, guias, rutas tematicas y colecciones curadas son creadas
          por nuestro equipo editorial. Cuando el contenido se basa en fuentes
          externas, siempre incluimos la atribucion correspondiente.
        </p>

        <h2>Reportar un error</h2>
        <p>
          Si encuentras informacion incorrecta o desactualizada, por favor{' '}
          <Link href="/contacto">contactanos</Link> y lo corregiremos lo antes
          posible.
        </p>
      </div>
    </main>
  );
}
