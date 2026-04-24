/**
 * Zod schemas for auth. Consumed by BOTH:
 *   - web API routes (src/app/api/auth/*) — server-side validation
 *   - mobile forms (mobile/app/(auth)/*) — client-side pre-flight validation
 *
 * Keeping the schema in one place guarantees mobile and web reject / accept
 * the SAME inputs, byte for byte. Never duplicate validation rules across
 * platforms — it's how bugs like "mobile accepts but server rejects" happen.
 */
import { z } from 'zod';

export const EMAIL_MAX = 320;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const NAME_MIN = 2;
export const NAME_MAX = 120;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .max(EMAIL_MAX, `El correo supera ${EMAIL_MAX} caracteres`)
    .email('Correo electrónico inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .max(PASSWORD_MAX, 'Contraseña demasiado larga'),
  rememberMe: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(NAME_MIN, `El nombre debe tener al menos ${NAME_MIN} caracteres`)
    .max(NAME_MAX, `El nombre supera ${NAME_MAX} caracteres`),
  email: z
    .string()
    .trim()
    .max(EMAIL_MAX, `El correo supera ${EMAIL_MAX} caracteres`)
    .email('Correo electrónico inválido'),
  password: z
    .string()
    .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
    .max(PASSWORD_MAX, 'Contraseña demasiado larga'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** Passwords we specifically blocklist. Cheap defense vs the worst offenders. */
export const WEAK_PASSWORDS = new Set([
  '12345678',
  'password',
  'password1',
  'qwerty123',
  'admin123',
  '00000000',
  'iloveyou',
]);

export function isWeakPassword(pw: string): boolean {
  return WEAK_PASSWORDS.has(pw.toLowerCase());
}

export const recoverSchema = z.object({
  email: z
    .string()
    .trim()
    .max(EMAIL_MAX, `El correo supera ${EMAIL_MAX} caracteres`)
    .email('Correo electrónico inválido'),
});
export type RecoverInput = z.infer<typeof recoverSchema>;

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(32, 'Token inválido')
    .max(256, 'Token inválido'),
  password: z
    .string()
    .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`)
    .max(PASSWORD_MAX, 'Contraseña demasiado larga'),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
