/**
 * Component tests for ShareTripButton.
 *
 * Locks in:
 *   - Initial "Compartir" button is rendered; clicking opens the dialog.
 *   - If opening with no existing token, POST /api/trips/:id/share fires.
 *   - If a trip arrives already public, the URL is pre-filled without a POST.
 *   - DELETE clears the token via /api/trips/:id/share.
 *   - Copy button writes to clipboard.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { ShareTripButton } from '@/components/trip/ShareTripButton';

function click(el: HTMLElement) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

const common = {
  tripId: 'trip-123',
  label: 'Compartir',
  closeLabel: 'Cerrar',
  rotateLabel: 'Rotar enlace',
  revokeLabel: 'Desactivar',
  copyLabel: 'Copiar',
  copiedLabel: '¡Copiado!',
} as const;

describe('<ShareTripButton>', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn(async () => {}) },
    });
  });

  it('renders the "Compartir" trigger button', () => {
    render(
      <ShareTripButton {...common} initialToken={null} initialPublic={false} />,
    );
    expect(
      screen.getByRole('button', { name: /compartir/i }),
    ).toBeInTheDocument();
  });

  it('opens dialog and POSTs when there is no existing token', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        token: 'abc123',
        url: 'https://rutasenmx.com/compartido/abc123',
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ShareTripButton {...common} initialToken={null} initialPublic={false} />,
    );
    click(screen.getByRole('button', { name: /compartir/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/trips/trip-123/share',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('pre-fills URL without POSTing when the trip is already public', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ShareTripButton
        {...common}
        initialToken="preexisting"
        initialPublic={true}
      />,
    );
    click(screen.getByRole('button', { name: /compartir/i }));

    // URL must appear without any fetch being made.
    const input = await screen.findByDisplayValue(/\/compartido\/preexisting$/);
    expect(input).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('DELETE revokes the token', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, token: 'new', url: 'https://x/compartido/new' }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ShareTripButton
        {...common}
        initialToken="preexisting"
        initialPublic={true}
      />,
    );
    click(screen.getByRole('button', { name: /compartir/i }));

    const revokeBtn = await screen.findByRole('button', {
      name: /desactivar/i,
    });
    click(revokeBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/trips/trip-123/share',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  it('copies URL to clipboard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          token: 't',
          url: 'https://rutasenmx.com/compartido/t',
        }),
      })),
    );

    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });

    // Use initialPublic=true so URL is pre-filled synchronously (skip async fetch+state dance).
    render(
      <ShareTripButton
        {...common}
        initialToken="preloaded"
        initialPublic={true}
      />,
    );
    click(screen.getByRole('button', { name: /compartir/i }));

    const copyBtn = await screen.findByRole('button', { name: /^copiar$/i });
    click(copyBtn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
      const calls = writeText.mock.calls as unknown as Array<[string]>;
      const arg = calls[0]?.[0] ?? '';
      expect(typeof arg).toBe('string');
      expect(arg).toContain('/compartido/preloaded');
    });
  });
});
