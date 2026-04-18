import type { Metadata } from 'next';
import PlanearClient from './planear-client';
import { buildPageMetadata } from '@/lib/seo/metadata';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Planear ruta por México · Rutas en MX',
    description:
      'Arma tu ruta por carretera paso a paso: agrega paradas, calcula distancias, evita casetas y descubre lugares en el camino con nuestro planificador interactivo.',
    path: '/planear',
    keywords: [
      'planear ruta México',
      'planificador de rutas',
      'calculadora de casetas México',
      'road trip planner México',
      'rutas por carretera',
    ],
  });
}

export default function PlanearPage() {
  return <PlanearClient />;
}
