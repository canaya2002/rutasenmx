import { NextResponse } from 'next/server';
import { mockStates } from '@/lib/data/mock';

/**
 * GET /api/states
 *
 * Returns the 32 Mexican states with their editorial metadata.
 * Cached aggressively — this list doesn't change.
 */
export async function GET() {
  return NextResponse.json(
    { states: mockStates, total: mockStates.length },
    {
      headers: {
        'Cache-Control':
          'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
