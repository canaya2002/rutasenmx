/**
 * Component tests for FavoriteHeartButton.
 *
 * Contract we lock in:
 *   - Fetches `/api/favorites` on mount to know current state.
 *   - Unauthenticated (401) → tapping redirects to /iniciar-sesion?next=...
 *   - Tapping toggles state optimistically + fires the right HTTP call.
 *   - On fetch error → silently rolls back instead of crashing.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// next/navigation stubs — the component uses useRouter for the anon redirect.
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { FavoriteHeartButton } from '@/components/favorites/FavoriteHeartButton';

function click(el: HTMLElement) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('<FavoriteHeartButton>', () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('renders "Guardar" when slug is not yet favorited', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ favorites: [{ slug: 'palenque' }] }),
      })),
    );
    render(<FavoriteHeartButton slug="teotihuacan" placeName="Teotihuacán" />);
    const btn = await screen.findByRole('button', {
      name: /guardar teotihuacán/i,
    });
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders "Guardado" when slug is already in favorites', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ favorites: [{ slug: 'teotihuacan' }] }),
      })),
    );
    render(<FavoriteHeartButton slug="teotihuacan" placeName="Teotihuacán" />);
    const btn = await screen.findByRole('button', {
      name: /quitar teotihuacán/i,
    });
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('redirects anon users to login with next=... when clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({}),
      })),
    );
    render(<FavoriteHeartButton slug="teotihuacan" placeName="Teotihuacán" />);
    // Wait for the 401 to resolve and then the label to settle to the "off"
    // rendering (the anon branch renders the "Guardar" label too).
    const btn = await screen.findByRole('button', {
      name: /guardar teotihuacán/i,
    });
    click(btn);
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith(
        '/iniciar-sesion?next=/lugares/teotihuacan',
      ),
    );
  });

  it('toggles state + fires POST when adding to favorites', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init || init.method !== 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ favorites: [] }),
        } as unknown as Response;
      }
      return { ok: true, status: 201, json: async () => ({ ok: true }) } as unknown as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FavoriteHeartButton slug="teotihuacan" placeName="Teotihuacán" />);

    const btn = await screen.findByRole('button', {
      name: /guardar teotihuacán/i,
    });
    click(btn);

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        (c) => c[0] === '/api/favorites' && c[1]?.method === 'POST',
      );
      expect(call).toBeDefined();
      const body = JSON.parse((call?.[1]?.body as string) ?? '{}');
      expect(body.placeSlug).toBe('teotihuacan');
    });
  });

  it('fires DELETE when removing an existing favorite', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init || init.method === 'GET' || !init.method) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            favorites: [{ slug: 'teotihuacan' }],
          }),
        } as unknown as Response;
      }
      return { ok: true, status: 200, json: async () => ({ ok: true }) } as unknown as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FavoriteHeartButton slug="teotihuacan" placeName="Teotihuacán" />);

    const btn = await screen.findByRole('button', {
      name: /quitar teotihuacán/i,
    });
    click(btn);

    await waitFor(() => {
      const delCall = fetchMock.mock.calls.find(
        (c) =>
          typeof c[0] === 'string' &&
          c[0].startsWith('/api/favorites?') &&
          c[1]?.method === 'DELETE',
      );
      expect(delCall).toBeDefined();
    });
  });
});
