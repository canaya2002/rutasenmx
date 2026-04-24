import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/middleware';
import { createCheckoutSession } from '@/lib/subscription/stripe';
import { getActiveSubscriptions } from '@/lib/subscription/current-plan';
import type { PlanSlug, BillingInterval } from '@/lib/subscription/plans';
import { emit, EVENTS } from '@/lib/analytics';

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'premium']),
  interval: z.enum(['monthly', 'annual']),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { plan, interval } = parsed.data;

    // Anti-double-billing: block if user already has an active IAP sub on
    // mobile. They must cancel there before we'll let them buy again on web.
    const active = await getActiveSubscriptions(session.userId);
    const mobileSub = active.find(
      (s) => s.source === 'apple_iap' || s.source === 'google_iap',
    );
    if (mobileSub) {
      return NextResponse.json(
        {
          error:
            'Ya tienes una suscripción activa en la app móvil. Cancélala primero desde App Store / Google Play para suscribirte aquí.',
          existingSource: mobileSub.source,
          existingPlan: mobileSub.slug,
        },
        { status: 409 },
      );
    }

    const url = await createCheckoutSession(
      session.userId,
      plan as PlanSlug,
      interval as BillingInterval,
    );

    emit(EVENTS.checkout_started, {
      userId: session.userId,
      properties: { plan, interval },
    });

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof Error && error.message === 'Inicia sesion para continuar') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Error al crear la sesion de pago' },
      { status: 500 },
    );
  }
}
