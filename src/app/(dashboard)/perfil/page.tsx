'use client';

import { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useLocale } from '@/components/providers/LocaleProvider';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  plan: string;
}

export default function PerfilPage() {
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const L = useMemo(
    () => ({
      title: isEn ? 'Profile' : 'Perfil',
      personalInfo: isEn ? 'Personal information' : 'Información personal',
      changeAvatar: isEn ? 'Change avatar' : 'Cambiar avatar',
      name: isEn ? 'Name' : 'Nombre',
      email: isEn ? 'Email address' : 'Correo electrónico',
      save: isEn ? 'Save changes' : 'Guardar cambios',
      saving: isEn ? 'Saving…' : 'Guardando…',
      vehicle: isEn ? 'Vehicle' : 'Vehículo',
      vehicleType: isEn ? 'Vehicle type' : 'Tipo de vehículo',
      car: isEn ? 'Car' : 'Auto',
      motorcycle: isEn ? 'Motorcycle' : 'Motocicleta',
      campervan: 'Campervan',
      rv: isEn ? 'RV' : 'Casa rodante',
      travelPrefs: isEn ? 'Travel preferences' : 'Preferencias de viaje',
      travelStyle: isEn ? 'Travel style' : 'Estilo de viaje',
      noPreference: isEn ? 'No preference' : 'Sin preferencia',
      family: isEn ? 'Family' : 'Familia',
      couple: isEn ? 'Couple' : 'Pareja',
      solo: isEn ? 'Solo' : 'Solo',
      adventure: isEn ? 'Adventure' : 'Aventura',
      cultural: isEn ? 'Cultural' : 'Cultural',
      nature: isEn ? 'Nature' : 'Naturaleza',
      foodie: 'Foodie',
      changePassword: isEn ? 'Change password' : 'Cambiar contraseña',
      currentPassword: isEn ? 'Current password' : 'Contraseña actual',
      newPassword: isEn ? 'New password' : 'Nueva contraseña',
      confirmNewPassword: isEn ? 'Confirm new password' : 'Confirmar nueva contraseña',
      changing: isEn ? 'Changing…' : 'Cambiando…',
      // Validation
      shortName: isEn ? 'Name must be at least 2 characters' : 'El nombre debe tener al menos 2 caracteres',
      invalidEmail: isEn ? 'Invalid email address' : 'Correo electrónico inválido',
      enterCurrentPassword: isEn ? 'Enter your current password' : 'Ingresa tu contraseña actual',
      shortNewPassword: isEn
        ? 'New password must be at least 8 characters'
        : 'La nueva contraseña debe tener al menos 8 caracteres',
      passwordsMismatch: isEn ? "Passwords don't match" : 'Las contraseñas no coinciden',
      profileUpdated: isEn ? 'Profile updated successfully' : 'Perfil actualizado correctamente',
      profileError: isEn ? 'Error updating profile' : 'Error al actualizar el perfil',
      passwordUpdated: isEn
        ? 'Password updated successfully'
        : 'Contraseña actualizada correctamente',
      passwordError: isEn ? 'Error changing password' : 'Error al cambiar la contraseña',
      connectionError: isEn ? 'Connection error' : 'Error de conexión',
    }),
    [isEn],
  );

  const profileSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, L.shortName),
        email: z.string().email(L.invalidEmail),
      }),
    [L.shortName, L.invalidEmail],
  );

  const passwordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, L.enterCurrentPassword),
          newPassword: z.string().min(8, L.shortNewPassword),
          confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: L.passwordsMismatch,
          path: ['confirmPassword'],
        }),
    [L.enterCurrentPassword, L.shortNewPassword, L.passwordsMismatch],
  );

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [vehicleType, setVehicleType] = useState('car');
  const [travelStyle, setTravelStyle] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setProfileForm({
            name: data.user.name || '',
            email: data.user.email || '',
          });
        }
      } catch {
        // Session expired
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setErrors({});

    const result = profileSchema.safeParse(profileForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        setMessage(L.profileUpdated);
        setIsError(false);
      } else {
        const data = await res.json();
        setMessage(data.error || L.profileError);
        setIsError(true);
      }
    } catch {
      setMessage(L.connectionError);
      setIsError(true);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setErrors({});

    const result = passwordSchema.safeParse(passwordForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (res.ok) {
        setMessage(L.passwordUpdated);
        setIsError(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await res.json();
        setMessage(data.error || L.passwordError);
        setIsError(true);
      }
    } catch {
      setMessage(L.connectionError);
      setIsError(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-black" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">{L.title}</h1>

      {message && (
        <div
          className={`mb-6 rounded-lg p-3 text-sm ${
            isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleProfileSubmit} className="mb-10 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">{L.personalInfo}</h2>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-bold text-slate-600">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {L.changeAvatar}
          </button>
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            {L.name}
          </label>
          <input
            id="name"
            type="text"
            value={profileForm.name}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            {L.email}
          </label>
          <input
            id="email"
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? L.saving : L.save}
        </button>
      </form>

      <div className="mb-10 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">{L.vehicle}</h2>
        <div>
          <label htmlFor="vehicleType" className="mb-1 block text-sm font-medium text-slate-700">
            {L.vehicleType}
          </label>
          <select
            id="vehicleType"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="car">{L.car}</option>
            <option value="motorcycle">{L.motorcycle}</option>
            <option value="campervan">{L.campervan}</option>
            <option value="rv">{L.rv}</option>
          </select>
        </div>
      </div>

      <div className="mb-10 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">{L.travelPrefs}</h2>
        <div>
          <label htmlFor="travelStyle" className="mb-1 block text-sm font-medium text-slate-700">
            {L.travelStyle}
          </label>
          <select
            id="travelStyle"
            value={travelStyle}
            onChange={(e) => setTravelStyle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">{L.noPreference}</option>
            <option value="familia">{L.family}</option>
            <option value="pareja">{L.couple}</option>
            <option value="solo">{L.solo}</option>
            <option value="aventura">{L.adventure}</option>
            <option value="cultural">{L.cultural}</option>
            <option value="naturaleza">{L.nature}</option>
            <option value="foodie">{L.foodie}</option>
          </select>
        </div>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">{L.changePassword}</h2>

        <div>
          <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-slate-700">
            {L.currentPassword}
          </label>
          <input
            id="currentPassword"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.currentPassword}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-slate-700">
            {L.newPassword}
          </label>
          <input
            id="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmNewPassword"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            {L.confirmNewPassword}
          </label>
          <input
            id="confirmNewPassword"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? L.changing : L.changePassword}
        </button>
      </form>
    </div>
  );
}
