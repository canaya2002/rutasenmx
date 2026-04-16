import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createPortalSession } from '@/lib/subscription/stripe';

export async function POST() {
  try {
    const session = await requireAuth();
    const url = await createPortalSession(session.userId);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof Error && error.message === 'Inicia sesion para continuar') {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Error al abrir el portal de facturacion' },
      { status: 500 },
    );
  }
}
