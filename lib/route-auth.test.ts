import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));

import { createClient } from '@supabase/supabase-js';
import {
  getSupabaseUser,
  isAdminRequest,
  requireAdmin,
  requireOwnerOrAdmin,
} from './route-auth';

const createClientMock = vi.mocked(createClient);

const URL = 'https://example.supabase.co';
const ANON = 'anon-key';

function mockSupabaseUser(phone: string | null, id = 'user-1') {
  createClientMock.mockReturnValue({
    auth: {
      getUser: async () => ({ data: { user: { id, phone, user_metadata: {} } }, error: null }),
    },
  } as never);
}

function authedRequest(token: string | null, adminKey?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (adminKey) headers['x-admin-key'] = adminKey;
  return new Request('http://localhost/api/x', { headers });
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.ADMIN_API_KEY = 'correct-admin-key-123';
  process.env.NEXT_PUBLIC_SUPABASE_URL = URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isAdminRequest (timing-safe)', () => {
  it('accepts the correct key', () => {
    expect(isAdminRequest(authedRequest(null, 'correct-admin-key-123'))).toBe(true);
  });

  it('rejects a same-length wrong key', () => {
    expect(isAdminRequest(authedRequest(null, 'wrongx-admin-key-123'))).toBe(false);
  });

  it('rejects a different-length key without leaking', () => {
    expect(isAdminRequest(authedRequest(null, 'short'))).toBe(false);
    expect(isAdminRequest(authedRequest(null))).toBe(false);
  });

  it('fails closed when ADMIN_API_KEY is missing', () => {
    delete process.env.ADMIN_API_KEY;
    expect(isAdminRequest(authedRequest(null, 'correct-admin-key-123'))).toBe(false);
  });
});

describe('requireAdmin', () => {
  it('returns 503 when not configured', () => {
    delete process.env.ADMIN_API_KEY;
    const res = requireAdmin(authedRequest(null, 'anything'));
    expect(res?.status).toBe(503);
  });

  it('returns 401 without the key and null with it', () => {
    const denied = requireAdmin(authedRequest(null));
    expect(denied?.status).toBe(401);
    expect(requireAdmin(authedRequest(null, 'correct-admin-key-123'))).toBeNull();
  });
});

describe('requireOwnerOrAdmin (+63/09 suffix match)', () => {
  it('matches +63 and 09 variants via last-10 digits', async () => {
    mockSupabaseUser('+639171234567');
    const res = await requireOwnerOrAdmin(authedRequest('valid-token'), '09171234567');
    expect(res).toBeNull();
  });

  it('matches 63-prefix token phone against 09 input', async () => {
    mockSupabaseUser('639171234567');
    const res = await requireOwnerOrAdmin(authedRequest('valid-token'), '+639171234567');
    expect(res).toBeNull();
  });

  it('forbids a different number with 403', async () => {
    mockSupabaseUser('+639171234567');
    const res = await requireOwnerOrAdmin(authedRequest('valid-token'), '09170000000');
    expect(res?.status).toBe(403);
  });

  it('lets admin bypass ownership', async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error('nope') }),
      },
    } as never);
    const res = await requireOwnerOrAdmin(
      authedRequest(null, 'correct-admin-key-123'),
      '09170000000'
    );
    expect(res).toBeNull();
  });

  it('returns 401 with no credentials', async () => {
    createClientMock.mockReturnValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error('nope') }),
      },
    } as never);
    const res = await requireOwnerOrAdmin(authedRequest(null), '09171234567');
    expect(res?.status).toBe(401);
  });

  it('getSupabaseUser returns null with no bearer token', async () => {
    const user = await getSupabaseUser(authedRequest(null));
    expect(user).toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
