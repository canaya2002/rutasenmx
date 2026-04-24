/**
 * Shared Zod schema tests. The schemas power BOTH web API routes and mobile
 * forms, so a single contract change must pass here before shipping.
 */
import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  isWeakPassword,
  PASSWORD_MIN,
  NAME_MIN,
} from '../../../shared/src/schemas/auth';

describe('loginSchema', () => {
  it('accepts valid inputs', () => {
    const r = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'anypassword',
    });
    expect(r.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(r.success).toBe(false);
  });

  it('trims email whitespace', () => {
    const r = loginSchema.safeParse({
      email: '   user@example.com   ',
      password: 'p',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('user@example.com');
  });
});

describe('registerSchema', () => {
  it('enforces minimum password length', () => {
    const short = '1234567'; // PASSWORD_MIN - 1
    const r = registerSchema.safeParse({
      name: 'Ana',
      email: 'a@b.com',
      password: short,
    });
    expect(r.success).toBe(false);
  });

  it('accepts password at minimum length', () => {
    const exactly = 'a'.repeat(PASSWORD_MIN);
    const r = registerSchema.safeParse({
      name: 'Ana',
      email: 'a@b.com',
      password: exactly,
    });
    expect(r.success).toBe(true);
  });

  it('enforces minimum name length', () => {
    const tooShort = 'a'.repeat(NAME_MIN - 1);
    const r = registerSchema.safeParse({
      name: tooShort,
      email: 'a@b.com',
      password: 'validpassword',
    });
    expect(r.success).toBe(false);
  });
});

describe('isWeakPassword', () => {
  it('blocks well-known weak passwords', () => {
    expect(isWeakPassword('12345678')).toBe(true);
    expect(isWeakPassword('password')).toBe(true);
    expect(isWeakPassword('PASSWORD')).toBe(true);
  });

  it('allows a unique password', () => {
    expect(isWeakPassword('r0adTr1pMex_2026')).toBe(false);
  });
});
