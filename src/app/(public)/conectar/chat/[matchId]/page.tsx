import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { buildPageMetadata } from '@/lib/seo/metadata';
import { optionalAuth } from '@/lib/auth/middleware';
import { canAccess } from '@/lib/subscription/plans';
import { getMatchForUser, listMessages } from '@/lib/social/chat';
import { getProfilesByUserIds } from '@/lib/social/discovery';
import { ChatClient } from '@/components/social/ChatClient';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Chat · Conectar',
    description: 'Conversa con quien hiciste match.',
    path: '/conectar/chat',
  }),
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ matchId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { matchId } = await params;

  const session = await optionalAuth();
  if (!session) redirect(`/iniciar-sesion?next=/conectar/chat/${matchId}`);
  if (!canAccess(session.plan, 'social_connect')) redirect('/conectar');

  let match;
  let otherId: string;
  try {
    const result = await getMatchForUser(matchId, session.userId);
    match = result.match;
    otherId = result.otherId;
  } catch {
    notFound();
  }

  const profilesMap = await getProfilesByUserIds([otherId]);
  const other = profilesMap.get(otherId);
  if (!other) notFound();

  const messages = await listMessages(matchId, session.userId);

  return (
    <ChatClient
      matchId={matchId}
      other={other}
      initialMessages={messages}
      myUserId={session.userId}
      isClosed={match.closedAt != null}
    />
  );
}
