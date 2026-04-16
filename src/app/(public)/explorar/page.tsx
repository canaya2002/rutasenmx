import type { Metadata } from 'next';
import ExplorarClient from './explorar-client';

export const metadata: Metadata = {
  title: 'Explorar Mexico: mapa interactivo de lugares | Rutas en MX',
  description:
    'Descubre Pueblos Magicos, museos, zonas arqueologicas y mas en un mapa interactivo. Filtra por categoria, estado y presupuesto.',
  robots: { index: false, follow: true }, // noindex for dynamic filter combos
};

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  /* Extract initial filter values from URL */
  const initialCategory =
    typeof params.category === 'string' ? params.category : '';
  const initialEstado =
    typeof params.estado === 'string' ? params.estado : '';
  const initialBudget =
    typeof params.budget === 'string' ? params.budget : '';
  const initialTraveler =
    typeof params.viajero === 'string' ? params.viajero : '';

  return (
    <ExplorarClient
      initialCategory={initialCategory}
      initialEstado={initialEstado}
      initialBudget={initialBudget}
      initialTraveler={initialTraveler}
    />
  );
}
