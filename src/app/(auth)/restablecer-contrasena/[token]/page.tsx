'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';

import { useLocale } from '@/components/providers/LocaleProvider';

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const token = typeof params?.token === 'string' ? params.token : '';

  const L = useMemo(
    () => ({
      title: isEn ? 'Set a new password' : 'Restablecer contraseña',
      lead: isEn
        ? 'Choose a new password for your account.'
        : 'Elige una nueva contraseña para tu cuenta.',
      password: isEn ? 'New password' : 'Nueva contraseña',
      confirm: isEn ? 'Confirm password' : 'Confirmar contraseña',
      submit: isEn ? 'Update password' : 'Actualizar contraseña',
      submitting: isEn ? 'Updating…' : 'Actualizando…',
      tooShort: isEn
        ? 'Password must be at least 8 characters'
        : 'La contraseña debe tener al menos 8 caracteres',
      mismatch: isEn ? 'Passwords do not match' : 'Las contraseñas no coinciden',
      invalidToken: isEn
        ? 'This link is invalid or has expired. Request a new one.'
        : 'El enlace no es válido o ya expiró. Solicita uno nuevo.',
      genericError: isEn
        ? 'Could not update password. Please try again.'
        : 'No se pudo actualizar la contraseña. Intenta de nuevo.',
      connectionError: isEn
        ? 'Connection error. Please try again.'
        : 'Error de conexión. Intenta de nuevo.',
      done: isEn ? 'Password updated' : 'Contraseña actualizada',
      doneDesc: isEn
        ? 'You can now sign in with your new password.'
        : 'Ya puedes iniciar sesión con tu nueva contraseña.',
      goLogin: isEn ? 'Go to log in' : 'Ir a iniciar sesión',
      requestNew: isEn ? 'Request a new link' : 'Solicitar un nuevo enlace',
    }),
    [isEn],
  );

  const schema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8, L.tooShort),
          confirm: z.string(),
        })
        .refine((v) => v.password === v.confirm, {
          message: L.mismatch,
          path: ['confirm'],
        }),
    [L.tooShort, L.mismatch],
  );

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const result = schema.safeParse({ password, confirm });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    if (!token) {
      setError(L.invalidToken);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/iniciar-sesion'), 2500);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? L.genericError);
      }
    } catch {
      setError(L.connectionError);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">{L.done}</h1>
        <p className="mb-6 text-sm text-slate-600">{L.doneDesc}</p>
        <Link
          href="/iniciar-sesion"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          {L.goLogin}
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">
        {L.title}
      </h1>
      <p className="mb-6 text-center text-sm text-slate-600">{L.lead}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            {L.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            {L.confirm}
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError('');
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50"
        >
          {loading ? L.submitting : L.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link
          href="/recuperar-contrasena"
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          {L.requestNew}
        </Link>
      </p>
    </>
  );
}
