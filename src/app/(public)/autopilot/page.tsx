import type { Metadata } from 'next';
import { AutopilotWizard } from '@/components/ai/AutopilotWizard';

export const metadata: Metadata = {
  title: 'Autopilot: planea tu viaje con IA | Rutas en MX',
  description:
    'Deja que nuestra IA planee tu ruta perfecta por Mexico. Define origen, destino, fechas e intereses y recibe un itinerario personalizado.',
  robots: { index: false, follow: true },
};

export default function AutopilotPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <AutopilotWizard />
    </main>
  );
}
