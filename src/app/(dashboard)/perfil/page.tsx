'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electronico invalido'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contrasena actual'),
    newPassword: z.string().min(8, 'La nueva contrasena debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  });

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  plan: string;
}

export default function PerfilPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });

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
        setMessage('Perfil actualizado correctamente');
      } else {
        const data = await res.json();
        setMessage(data.error || 'Error al actualizar el perfil');
      }
    } catch {
      setMessage('Error de conexion');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
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
        setMessage('Contrasena actualizada correctamente');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await res.json();
        setMessage(data.error || 'Error al cambiar la contrasena');
      }
    } catch {
      setMessage('Error de conexion');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-orange-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">
        Perfil
      </h1>

      {message && (
        <div className={`mb-6 rounded-lg p-3 text-sm ${
          message.includes('Error') || message.includes('error')
            ? 'bg-red-50 text-red-700'
            : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Profile form */}
      <form onSubmit={handleProfileSubmit} className="mb-10 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Informacion personal
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-bold text-slate-600">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cambiar avatar
          </button>
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={profileForm.name}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Correo electronico
          </label>
          <input
            id="email"
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* Vehicle profile */}
      <div className="mb-10 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Vehiculo
        </h2>
        <div>
          <label htmlFor="vehicleType" className="mb-1 block text-sm font-medium text-slate-700">
            Tipo de vehiculo
          </label>
          <select
            id="vehicleType"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="car">Auto</option>
            <option value="motorcycle">Motocicleta</option>
            <option value="campervan">Campervan</option>
            <option value="rv">Casa rodante</option>
          </select>
        </div>
      </div>

      {/* Travel preferences */}
      <div className="mb-10 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Preferencias de viaje
        </h2>
        <div>
          <label htmlFor="travelStyle" className="mb-1 block text-sm font-medium text-slate-700">
            Estilo de viaje
          </label>
          <select
            id="travelStyle"
            value={travelStyle}
            onChange={(e) => setTravelStyle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Sin preferencia</option>
            <option value="familia">Familia</option>
            <option value="pareja">Pareja</option>
            <option value="solo">Solo</option>
            <option value="aventura">Aventura</option>
            <option value="cultural">Cultural</option>
            <option value="naturaleza">Naturaleza</option>
            <option value="foodie">Foodie</option>
          </select>
        </div>
      </div>

      {/* Password change */}
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Cambiar contrasena
        </h2>

        <div>
          <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-slate-700">
            Contrasena actual
          </label>
          <input
            id="currentPassword"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          {errors.currentPassword && <p className="mt-1 text-xs text-red-600">{errors.currentPassword}</p>}
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-slate-700">
            Nueva contrasena
          </label>
          <input
            id="newPassword"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>}
        </div>

        <div>
          <label htmlFor="confirmNewPassword" className="mb-1 block text-sm font-medium text-slate-700">
            Confirmar nueva contrasena
          </label>
          <input
            id="confirmNewPassword"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? 'Cambiando...' : 'Cambiar contrasena'}
        </button>
      </form>
    </div>
  );
}
