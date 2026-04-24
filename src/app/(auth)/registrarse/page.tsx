'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useLocale } from '@/components/providers/LocaleProvider';

/** Same-origin path guard shared with `/iniciar-sesion`. */
function safeNext(raw: string | null): string {
  if (!raw) return '/mis-viajes';
  if (!raw.startsWith('/')) return '/mis-viajes';
  if (raw.startsWith('//')) return '/mis-viajes';
  return raw;
}

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = safeNext(searchParams.get('next'));
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const L = useMemo(
    () => ({
      title: isEn ? 'Create account' : 'Crear cuenta',
      shortName: isEn
        ? 'Name must be at least 2 characters'
        : 'El nombre debe tener al menos 2 caracteres',
      invalidEmail: isEn ? 'Invalid email address' : 'Correo electrónico inválido',
      shortPassword: isEn
        ? 'Password must be at least 8 characters'
        : 'La contraseña debe tener al menos 8 caracteres',
      passwordsMismatch: isEn ? "Passwords don't match" : 'Las contraseñas no coinciden',
      mustAcceptTerms: isEn
        ? 'You must accept the terms and conditions'
        : 'Debes aceptar los términos y condiciones',
      accountError: isEn ? 'Account creation error' : 'Error al crear la cuenta',
      connectionError: isEn
        ? 'Connection error. Please try again.'
        : 'Error de conexión. Intenta de nuevo.',
      name: isEn ? 'Name' : 'Nombre',
      namePlaceholder: isEn ? 'Your name' : 'Tu nombre',
      email: isEn ? 'Email address' : 'Correo electrónico',
      password: isEn ? 'Password' : 'Contraseña',
      confirmPassword: isEn ? 'Confirm password' : 'Confirmar contraseña',
      iAccept: isEn ? 'I accept the' : 'Acepto los',
      terms: isEn ? 'terms and conditions' : 'términos y condiciones',
      and: isEn ? 'and the' : 'y la',
      privacy: isEn ? 'privacy policy' : 'política de privacidad',
      create: isEn ? 'Create account' : 'Crear cuenta',
      creating: isEn ? 'Creating account…' : 'Creando cuenta…',
      alreadyAccount: isEn ? 'Already have an account?' : '¿Ya tienes cuenta?',
      login: isEn ? 'Log in' : 'Iniciar sesión',
    }),
    [isEn],
  );

  const registerSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(2, L.shortName),
          email: z.string().email(L.invalidEmail),
          password: z.string().min(8, L.shortPassword),
          confirmPassword: z.string(),
          acceptTerms: z.boolean(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: L.passwordsMismatch,
          path: ['confirmPassword'],
        })
        .refine((data) => data.acceptTerms, {
          message: L.mustAcceptTerms,
          path: ['acceptTerms'],
        }),
    [L.shortName, L.invalidEmail, L.shortPassword, L.passwordsMismatch, L.mustAcceptTerms],
  );

  const [form, setForm] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<string, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error || L.accountError);
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
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            {L.name}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder={L.namePlaceholder}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

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
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="********"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
            {L.confirmPassword}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="********"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        <div>
          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={form.acceptTerms}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              {L.iAccept}{' '}
              <Link href="/terminos" className="font-medium text-emerald-600 hover:text-emerald-700">
                {L.terms}
              </Link>{' '}
              {L.and}{' '}
              <Link href="/privacidad" className="font-medium text-emerald-600 hover:text-emerald-700">
                {L.privacy}
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1 text-xs text-red-600">{errors.acceptTerms}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50"
        >
          {loading ? L.creating : L.create}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {L.alreadyAccount}{' '}
        <Link href="/iniciar-sesion" className="font-medium text-emerald-600 hover:text-emerald-700">
          {L.login}
        </Link>
      </p>
    </>
  );
}
