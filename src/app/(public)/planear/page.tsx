import type { Metadata } from 'next';
import PlanearClient from './planear-client';

export const metadata: Metadata = {
  title: 'Planear ruta por Mexico | Rutas en MX',
  description:
    'Planea tu ruta por carretera en Mexico. Agrega paradas, calcula distancias, evita casetas y descubre lugares en el camino.',
};

export default function PlanearPage() {
  return <PlanearClient />;
}
