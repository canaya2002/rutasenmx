import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getCurrentPlanSlug } from '@/lib/subscription/current-plan';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      );
    }

    // Read plan fresh from DB so a paid subscriber who just upgraded doesn't
    // see stale "free" until their next login.
    const plan = await getCurrentPlanSlug(session.userId);

    return NextResponse.json({
      user: {
        ...user,
        plan,
      },
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
