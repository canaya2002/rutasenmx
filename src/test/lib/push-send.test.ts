/**
 * Tests for `sendPushToUser` — the server-side Expo push helper.
 *
 * The helper must:
 *   1. Load the user's registered tokens from `push_tokens`.
 *   2. POST to Expo's push API.
 *   3. Prune tokens that Expo reports as `DeviceNotRegistered` so we don't
 *      keep wasting requests on revoked devices.
 *
 * We never hit Expo's real endpoint — fetch is mocked.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

interface Recorded {
  op: 'select' | 'delete';
  tokens?: string[];
}
const recorder: Recorded[] = [];
let fakeTokens: string[] = [];

function selectChain() {
  const node: Record<string, unknown> = {};
  node.from = vi.fn(() => node);
  node.where = vi.fn(async () => {
    recorder.push({ op: 'select' });
    return fakeTokens.map((t) => ({ token: t }));
  });
  return node;
}

function deleteChain() {
  const node: Record<string, unknown> = {};
  node.where = vi.fn(async (pred: { tokens?: string[] }) => {
    recorder.push({ op: 'delete', tokens: pred.tokens });
    return [];
  });
  return node;
}

vi.mock('@/db', () => ({
  db: {
    select: () => selectChain(),
    delete: () => deleteChain(),
  },
  pushTokens: { _: { name: 'push_tokens' } },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
  inArray: (_col: unknown, values: string[]) => ({ tokens: values }),
}));

import { sendPushToUser, isExpoPushToken } from '@/lib/push/send';

describe('isExpoPushToken', () => {
  it('accepts the ExponentPushToken[] form', () => {
    expect(isExpoPushToken('ExponentPushToken[abc123]')).toBe(true);
  });
  it('accepts the ExpoPushToken[] form', () => {
    expect(isExpoPushToken('ExpoPushToken[xyz]')).toBe(true);
  });
  it('rejects garbage', () => {
    expect(isExpoPushToken('not-a-token')).toBe(false);
    expect(isExpoPushToken('')).toBe(false);
    expect(isExpoPushToken(null)).toBe(false);
    expect(isExpoPushToken(123)).toBe(false);
  });
});

describe('sendPushToUser', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    recorder.length = 0;
    fakeTokens = [];
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing when the user has no registered tokens', async () => {
    fakeTokens = [];
    await sendPushToUser('user-1', { title: 'a', body: 'b' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts all registered tokens to Expo with the message payload', async () => {
    fakeTokens = ['ExponentPushToken[aaa]', 'ExponentPushToken[bbb]'];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { status: 'ok', id: '1' },
          { status: 'ok', id: '2' },
        ],
      }),
    });

    await sendPushToUser('user-1', {
      title: 'Hola',
      body: 'Mensaje',
      data: { path: '/conectar/matches' },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://exp.host/--/api/v2/push/send');
    const body = JSON.parse(init.body as string);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0].to).toBe('ExponentPushToken[aaa]');
    expect(body[0].title).toBe('Hola');
    expect(body[0].data).toEqual({ path: '/conectar/matches' });
    expect(body[0].priority).toBe('high');
  });

  it('prunes tokens marked DeviceNotRegistered after a send', async () => {
    fakeTokens = ['ExponentPushToken[good]', 'ExponentPushToken[dead]'];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { status: 'ok', id: '1' },
          {
            status: 'error',
            message: 'The recipient device is not registered with FCM.',
            details: { error: 'DeviceNotRegistered' },
          },
        ],
      }),
    });

    await sendPushToUser('user-1', { title: 't', body: 'b' });

    const del = recorder.find((r) => r.op === 'delete');
    expect(del).toBeDefined();
    expect(del?.tokens).toEqual(['ExponentPushToken[dead]']);
  });

  it('does not prune tokens for non-DeviceNotRegistered errors', async () => {
    fakeTokens = ['ExponentPushToken[a]'];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            status: 'error',
            message: 'Something else went wrong',
            details: { error: 'MessageRateExceeded' },
          },
        ],
      }),
    });

    await sendPushToUser('user-1', { title: 't', body: 'b' });
    expect(recorder.find((r) => r.op === 'delete')).toBeUndefined();
  });

  it('swallows network errors — must never throw', async () => {
    fakeTokens = ['ExponentPushToken[a]'];
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    await expect(
      sendPushToUser('user-1', { title: 't', body: 'b' }),
    ).resolves.toBeUndefined();
  });

  it('swallows non-2xx responses from Expo', async () => {
    fakeTokens = ['ExponentPushToken[a]'];
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(
      sendPushToUser('user-1', { title: 't', body: 'b' }),
    ).resolves.toBeUndefined();
  });

  it('is a no-op for an empty userId (guards malformed callers)', async () => {
    await sendPushToUser('', { title: 't', body: 'b' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
