'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useLocale } from '@/components/providers/LocaleProvider';

export default function RecoverPasswordPage() {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const L = useMemo(
    () => ({
      title: isEn ? 'Recover password' : 'Recuperar contraseña',
      lead: isEn
        ? "Enter your email and we'll send instructions to reset your password."
        : 'Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.',
      invalidEmail: isEn ? 'Invalid email address' : 'Correo electrónico inválido',
      sendError: isEn
        ? 'Could not send the email. Please try again.'
        : 'Error al enviar el correo. Intenta de nuevo.',
      connectionError: isEn
        ? 'Connection error. Please try again.'
        : 'Error de conexión. Intenta de nuevo.',
      emailSent: isEn ? 'Email sent' : 'Correo enviado',
      emailSentDesc: isEn
        ? 'If an account with that email exists, you will receive instructions to reset your password.'
        : 'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.',
      backToLogin: isEn ? 'Back to log in' : 'Volver a iniciar sesión',
      email: isEn ? 'Email address' : 'Correo electrónico',
      send: isEn ? 'Send instructions' : 'Enviar instrucciones',
      sending: isEn ? 'Sending…' : 'Enviando…',
    }),
    [isEn],
  );

  const recoverySchema = useMemo(
    () => z.object({ email: z.string().email(L.invalidEmail) }),
    [L.invalidEmail],
  );

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const result = recoverySchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok || res.status === 404) {
        setSuccess(true);
      } else {
        setError(L.sendError);
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
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">{L.emailSent}</h1>
        <p className="mb-6 text-sm text-slate-600">{L.emailSentDesc}</p>
        <Link
          href="/iniciar-sesion"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          {L.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">{L.title}</h1>
      <p className="mb-6 text-center text-sm text-slate-600">{L.lead}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="tu@correo.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50"
        >
          {loading ? L.sending : L.send}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/iniciar-sesion" className="font-medium text-emerald-600 hover:text-emerald-700">
          {L.backToLogin}
        </Link>
      </p>
    </>
  );
}
