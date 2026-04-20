/**
 * Domain types for the social (Conectar) feature.
 *
 * Keep these decoupled from DB rows so the UI never leaks schema internals.
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
}
