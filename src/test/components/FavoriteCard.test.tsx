/**
 * Component tests for FavoriteCard.
 *
 * Contract:
 *   - Renders name, categoryName, stateName.
 *   - Heart button fires DELETE /api/favorites?slug=... and hides the card
 *     on success.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

// next/image brings its own complexity; stub it as a plain img-like element.
// Using React.createElement avoids the @next/next/no-img-element lint warning.
vi.mock('next/image', async () => {
  const React = await import('react');
  return {
    default: ({ alt, src }: { alt: string; src: string }) =>
      React.createElement('img', { alt, src }),
  };
});

import { FavoriteCard } from '@/components/favorites/FavoriteCard';

function click(el: HTMLElement) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

const fav = {
  id: 'fav-1',
  slug: 'teotihuacan',
  name: 'Teotihuacán',
  image: 'https://example.com/teo.jpg',
  categoryName: 'Zona arqueológica',
  stateName: 'Estado de México',
  notes: 'Ir en equinoccio',
};

describe('<FavoriteCard>', () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('renders place name, category, state, and notes', () => {
    render(<FavoriteCard fav={fav} isEn={false} />);
    expect(screen.getByText('Teotihuacán')).toBeInTheDocument();
    expect(screen.getByText('Zona arqueológica')).toBeInTheDocument();
    expect(screen.getByText('Estado de México')).toBeInTheDocument();
    expect(screen.getByText(/equinoccio/)).toBeInTheDocument();
  });

  it('fires DELETE /api/favorites?slug=... when the heart is clicked', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(<FavoriteCard fav={fav} isEn={false} />);

    const removeBtn = screen.getByRole('button', {
      name: /quitar de favoritos/i,
    });
    click(removeBtn);

    await waitFor(() => {
      const call = (
        fetchMock.mock.calls as unknown as Array<[string, RequestInit | undefined]>
      ).find(
        (c) =>
          typeof c[0] === 'string' &&
          c[0].startsWith('/api/favorites?slug='),
      );
      expect(call).toBeDefined();
      expect(call?.[1]?.method).toBe('DELETE');
    });
    // Refresh is called so the dashboard counter updates.
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it('hides itself (returns null) after a successful delete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      })),
    );

    const { container } = render(<FavoriteCard fav={fav} isEn={false} />);
    click(
      screen.getByRole('button', { name: /quitar de favoritos/i }),
    );

    await waitFor(() => {
      expect(container.textContent).not.toContain('Teotihuacán');
    });
  });
});
