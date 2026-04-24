'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useLocale } from '@/components/providers/LocaleProvider';

type LoginForm = { email: string; password: string };

/**
 * Only accept `next=` values that are safe same-origin paths. Defends against
 * open-redirects (`?next=https://evil.com`).
 */
function safeNext(raw: string | null): string {
  if (!raw) return '/mis-viajes';
  if (!raw.startsWith('/')) return '/mis-viajes';
  if (raw.startsWith('//')) return '/mis-viajes';
  return raw;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = safeNext(searchParams.get('next'));
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const L = useMemo(
    () => ({
      title: isEn ? 'Log in' : 'Iniciar sesión',
      invalidEmail: isEn ? 'Invalid email address' : 'Correo electrónico inválido',
      shortPassword: isEn
        ? 'Password must be at least 6 characters'
        : 'La contraseña debe tener al menos 6 caracteres',
      loginError: isEn ? 'Login error' : 'Error al iniciar sesión',
      connectionError: isEn
        ? 'Connection error. Please try again.'
        : 'Error de conexión. Intenta de nuevo.',
      email: isEn ? 'Email address' : 'Correo electrónico',
      password: isEn ? 'Password' : 'Contraseña',
      rememberMe: isEn ? 'Remember me' : 'Recordarme',
      forgotPassword: isEn ? 'Forgot your password?' : '¿Olvidaste tu contraseña?',
      logIn: isEn ? 'Log in' : 'Iniciar sesión',
      loggingIn: isEn ? 'Logging in…' : 'Iniciando sesión…',
      orContinueWith: isEn ? 'Or continue with' : 'O continúa con',
      noAccount: isEn ? "Don't have an account?" : '¿No tienes cuenta?',
      createAccount: isEn ? 'Create account' : 'Crear cuenta',
    }),
    [isEn],
  );

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(L.invalidEmail),
        password: z.string().min(6, L.shortPassword),
      }),
    [L.invalidEmail, L.shortPassword],
  );

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginForm, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginForm;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rememberMe }),
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error || L.loginError);
        return;
      }

      router.push(nextParam);
      router.refresh();
    } catch {
      setServerError(L.connectionError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">{L.title}</h1>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            {L.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="tu@correo.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            {L.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="********"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            {L.rememberMe}
          </label>
          <Link
            href="/recuperar-contrasena"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            {L.forgotPassword}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50"
        >
          {loading ? L.loggingIn : L.logIn}
        </button>
      </form>

      {/* Social login placeholders */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-slate-500">{L.orContinueWith}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Google
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Facebook
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        {L.noAccount}{' '}
        <Link href="/registrarse" className="font-medium text-emerald-600 hover:text-emerald-700">
          {L.createAccount}
        </Link>
      </p>
    </>
  );
}
