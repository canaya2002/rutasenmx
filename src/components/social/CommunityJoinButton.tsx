'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LogOut, Plus } from 'lucide-react';

interface Props {
  slug: string;
  type: 'forum' | 'group' | 'channel';
  isMember: boolean;
  role: 'member' | 'moderator' | 'owner' | null;
}

export function CommunityJoinButton({ slug, type, isMember, role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [, start] = useTransition();

  if (type === 'forum') return null; // forums are implicitly public
  if (type === 'channel' && role === 'owner') return null;

  const toggle = async () => {
    setLoading(true);
    try {
      const method = isMember ? 'DELETE' : 'POST';
      const res = await fetch(`/api/social/communities/${slug}`, { method });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Error');
        return;
      }
      start(() => router.refresh());
    } finally {
      setLoading(false);
    }
  };

  if (isMember) {
    return (
      <button
        onClick={toggle}
        disabled={loading || role === 'owner'}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {role === 'owner' ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Dueño
          </>
        ) : (
          <>
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
    >
      <Plus className="h-3.5 w-3.5" />
      {loading ? 'Uniéndote…' : 'Unirme'}
    </button>
  );
}
