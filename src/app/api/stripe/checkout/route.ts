import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/middleware';
import { createCheckoutSession } from '@/lib/subscription/stripe';
import type { PlanSlug, BillingInterval } from '@/lib/subscription/plans';

const checkoutSchema = z.object({
  plan: z.enum(['basic', 'pro', 'premium']),
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
    const url = await createCheckoutSession(
      session.userId,
      plan as PlanSlug,
      interval as BillingInterval,
    );

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
