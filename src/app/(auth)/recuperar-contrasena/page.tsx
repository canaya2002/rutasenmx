'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';

const recoverySchema = z.object({
  email: z.string().email('Correo electronico invalido'),
});

export default function RecoverPasswordPage() {
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
      // In production, this would call an API endpoint to send the recovery email
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Always show success to avoid leaking whether an email exists
      if (res.ok || res.status === 404) {
        setSuccess(true);
      } else {
        setError('Error al enviar el correo. Intenta de nuevo.');
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
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
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Correo enviado
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          Si existe una cuenta con ese correo, recibiras instrucciones para restablecer tu contrasena.
        </p>
        <Link
          href="/iniciar-sesion"
          className="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          Volver a iniciar sesion
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">
        Recuperar contrasena
      </h1>
      <p className="mb-6 text-center text-sm text-slate-600">
        Ingresa tu correo y te enviaremos instrucciones para restablecer tu contrasena.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Correo electronico
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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="tu@correo.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar instrucciones'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/iniciar-sesion" className="font-medium text-orange-600 hover:text-orange-700">
          Volver a iniciar sesion
        </Link>
      </p>
    </>
  );
}
