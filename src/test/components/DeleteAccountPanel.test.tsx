/**
 * Component tests for DeleteAccountPanel.
 *
 * Guarantees:
 *   - Auto-opens when URL has `?delete=1` (deep link from mobile).
 *   - Requires typing literal `ELIMINAR` to enable the delete button.
 *   - Calls DELETE /api/account on confirmation.
 *   - Refuses to submit if the confirmation text doesn't match.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const pushMock = vi.fn();
let searchValue = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({ get: (k: string) => (k === 'delete' ? searchValue : null) }),
}));

import { DeleteAccountPanel } from '@/components/profile/DeleteAccountPanel';

function click(el: HTMLElement) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('<DeleteAccountPanel>', () => {
  beforeEach(() => {
    pushMock.mockReset();
    searchValue = '';
    vi.unstubAllGlobals();
  });

  it('renders the "Eliminar mi cuenta" trigger by default', () => {
    render(<DeleteAccountPanel />);
    expect(
      screen.getByRole('button', { name: /eliminar mi cuenta/i }),
    ).toBeInTheDocument();
  });

  it('auto-opens confirm form when ?delete=1 is present', () => {
    searchValue = '1';
    render(<DeleteAccountPanel />);
    expect(screen.getByLabelText(/ELIMINAR/i)).toBeInTheDocument();
  });

  it('delete button is disabled until user types ELIMINAR literally', () => {
    searchValue = '1';
    render(<DeleteAccountPanel />);
    const submit = screen.getByRole('button', {
      name: /eliminar definitivamente/i,
    });
    expect(submit).toBeDisabled();

    const input = screen.getByLabelText(/ELIMINAR/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'eliminar' } }); // lowercase
    expect(submit).toBeDisabled();

    fireEvent.change(input, { target: { value: 'ELIMINAR' } });
    expect(submit).not.toBeDisabled();
  });

  it('fires DELETE /api/account when confirmed', async () => {
    searchValue = '1';
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, message: 'done' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(<DeleteAccountPanel />);

    const input = screen.getByLabelText(/ELIMINAR/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ELIMINAR' } });

    click(screen.getByRole('button', { name: /eliminar definitivamente/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/account',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});
