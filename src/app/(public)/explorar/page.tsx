import type { Metadata } from 'next';
import ExplorarClient from './explorar-client';

export const metadata: Metadata = {
  title: 'Explorar México: mapa interactivo de lugares | Rutas en MX',
  description:
    'Descubre Pueblos Mágicos, museos, zonas arqueológicas y más en un mapa interactivo. Filtra por categoría, estado y presupuesto.',
  robots: { index: false, follow: true },
};

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const initialCategory =
    typeof params.category === 'string' ? params.category : '';
  const initialEstado =
    typeof params.estado === 'string' ? params.estado : '';
  const initialSearch =
    typeof params.search === 'string' ? params.search : '';

  return (
    <ExplorarClient
      initialCategory={initialCategory}
      initialEstado={initialEstado}
      initialSearch={initialSearch}
    />
  );
}
