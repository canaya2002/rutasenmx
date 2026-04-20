import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { REPORT_REASONS, reportUser, type ReportReason } from '@/lib/social/moderation';
import { requireSocialAccess, isGuardError } from '@/lib/social/guards';

const schema = z.object({
  reportedId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS as unknown as [ReportReason, ...ReportReason[]]),
  note: z.string().trim().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const sessionOrError = await requireSocialAccess();
  if (isGuardError(sessionOrError)) return sessionOrError;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    await reportUser({
      reporterId: sessionOrError.userId,
      reportedId: parsed.data.reportedId,
      reason: parsed.data.reason,
      note: parsed.data.note ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 400 },
    );
  }
}
