import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Viaje compartido | Rutas en MX',
  description: 'Visualiza un viaje compartido por otro usuario de Rutas en MX.',
  robots: { index: false, follow: false },
};

/**
 * Shared trip viewer.
 *
 * Renders a read-only view of a trip that was shared via a unique token link.
 *
 * TODO: Fetch the shared trip from DB using the token
 * TODO: Implement SharedTripView component with map + itinerary
 */
export default async function CompartidoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // TODO: Replace with DB lookup
  // const sharedTrip = await db
  //   .select()
  //   .from(sharedTrips)
  //   .where(eq(sharedTrips.shareToken, token))
  //   .limit(1);
  //
  // if (!sharedTrip) {
  //   notFound();
  // }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <section className="rounded-xl border bg-card p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          Viaje compartido
        </h1>
        <p className="mb-6 text-muted-foreground">
          Visualiza el itinerario de un viaje compartido contigo.
        </p>

        {/* Placeholder - will be replaced with SharedTripView */}
        <div className="mx-auto max-w-md rounded-lg border border-dashed border-border p-12">
          <p className="text-sm text-muted-foreground">
            Cargando viaje compartido...
          </p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            Token: {token}
          </p>
        </div>
      </section>
    </main>
  );
}
