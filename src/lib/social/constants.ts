import { ESTADOS_MEXICO } from '@/lib/constants';
import type { SocialIntent } from './types';

export const SOCIAL_INTENT_LABELS: Record<SocialIntent, string> = {
  convivir: 'Convivir local',
  salir: 'Salir de fiesta',
  explorar: 'Explorar lugares',
  conocer: 'Conocer gente',
};

export const SOCIAL_INTENT_EMOJIS: Record<SocialIntent, string> = {
  convivir: '🌮',
  salir: '🎉',
  explorar: '🧭',
  conocer: '🤝',
};

export const SOCIAL_INTEREST_OPTIONS = [
  'naturaleza',
  'playa',
  'cultura',
  'gastronomía',
  'fiesta',
  'fotografía',
  'senderismo',
  'mezcal',
  'surf',
  'arqueología',
  'pueblos-mágicos',
  'road-trip',
  'café',
  'festivales',
  'aventura',
  'yoga',
  'artesanías',
  'música',
  'historia',
  'arte',
] as const;

export const SOCIAL_LANGUAGE_OPTIONS = [
  'Español',
  'Inglés',
  'Francés',
  'Portugués',
  'Alemán',
  'Italiano',
  'Japonés',
  'Chino',
] as const;

export const SOCIAL_BIO_MAX = 280;
export const SOCIAL_DISPLAY_NAME_MAX = 80;
export const SOCIAL_MESSAGE_MAX = 2000;
export const SOCIAL_MESSAGE_MIN = 1;

/** Hard ceiling to prevent abuse until we ship rate-limiting infra. */
export const SOCIAL_DAILY_SWIPE_LIMIT = 120;

/** How many candidates to return per discovery call. */
export const DISCOVERY_PAGE_SIZE = 20;

/** Maps estado slug → estado name using the canonical list. */
export const ESTADO_NAME_BY_SLUG: Record<string, string> = Object.fromEntries(
  ESTADOS_MEXICO.map((e) => [e.slug, e.name]),
);

// ── Moderation (safe for client imports) ────────────────────────────────────
export const REPORT_REASONS = [
  'harassment',
  'spam',
  'inappropriate_content',
  'fake_profile',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  harassment: 'Acoso o intimidación',
  spam: 'Spam o promoción',
  inappropriate_content: 'Contenido inapropiado',
  fake_profile: 'Perfil falso',
  other: 'Otro motivo',
};
