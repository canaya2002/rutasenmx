/**
 * Social / match domain types (Tinder-style swipe + chat + communities).
 * Mirror of src/lib/social/types.ts on the web side.
 */

export type SocialIntent = 'convivir' | 'salir' | 'explorar' | 'conocer';
export type SocialSwipeAction = 'like' | 'pass';

export interface SocialProfileView {
  userId: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  destinoEstadoSlug: string | null;
  destinoEstadoName: string | null;
  interests: string[];
  intent: SocialIntent | null;
  age: number | null;
  languages: string[];
  travelFrom: string | null;
  travelTo: string | null;
  isVisible: boolean;
}

export interface SocialMatchView {
  matchId: string;
  other: SocialProfileView;
  createdAt: string;
  lastMessageAt: string | null;
  isClosed: boolean;
  unreadCount: number;
  lastMessagePreview: string | null;
}

export interface SocialMessageView {
  id: string;
  matchId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface SocialSwipeResult {
  matched: boolean;
  matchId?: string;
  otherProfile?: SocialProfileView;
}

// ── Report reasons (shared across web + mobile UI) ──────────────────────────
export const REPORT_REASONS = [
  'harassment',
  'spam',
  'inappropriate_content',
  'fake_profile',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS_ES: Record<ReportReason, string> = {
  harassment: 'Acoso o intimidación',
  spam: 'Spam o promoción',
  inappropriate_content: 'Contenido inapropiado',
  fake_profile: 'Perfil falso',
  other: 'Otro motivo',
};

export const REPORT_REASON_LABELS_EN: Record<ReportReason, string> = {
  harassment: 'Harassment or intimidation',
  spam: 'Spam or promotion',
  inappropriate_content: 'Inappropriate content',
  fake_profile: 'Fake profile',
  other: 'Other reason',
};

// ── Social intent labels + emojis (UI helpers) ──────────────────────────────
export const SOCIAL_INTENT_LABELS_ES: Record<SocialIntent, string> = {
  convivir: 'Convivir local',
  salir: 'Salir de fiesta',
  explorar: 'Explorar lugares',
  conocer: 'Conocer gente',
};

export const SOCIAL_INTENT_LABELS_EN: Record<SocialIntent, string> = {
  convivir: 'Hang out local',
  salir: 'Party / nightlife',
  explorar: 'Explore places',
  conocer: 'Meet people',
};

export const SOCIAL_INTENT_EMOJIS: Record<SocialIntent, string> = {
  convivir: '🌮',
  salir: '🎉',
  explorar: '🧭',
  conocer: '🤝',
};
