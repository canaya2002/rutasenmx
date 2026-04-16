import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { createSession, setSessionCookie } from '@/lib/auth/session';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Correo o contrasena incorrectos' },
        { status: 401 },
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Correo o contrasena incorrectos' },
        { status: 401 },
      );
    }

    // Check if user is soft-deleted
    if (user.deletedAt) {
      return NextResponse.json(
        { error: 'Esta cuenta ha sido desactivada' },
        { status: 403 },
      );
    }

    // Create session
    const token = await createSession(
      user.id,
      user.role as 'user' | 'admin' | 'editor',
      'free', // Default plan; in production, fetch from subscription
    );

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
