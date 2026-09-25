import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ getDbPool: vi.fn() }));

import { getDbPool } from '@/lib/db';
import { POST } from './route';

const getDbPoolMock = vi.mocked(getDbPool);

function postJson(body: unknown) {
  return new Request('http://localhost/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  phone_number: '09171234567',
  full_name: 'Test Fisher',
  home_port_name: 'Mercedes Fish Port',
  latitude: 14.1,
  longitude: 122.9,
  preferred_advisory_time: '05:00:00',
};

beforeEach(() => {
  vi.resetAllMocks();
  // Fail loudly if a test unexpectedly hits the network fallback.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('fetch should not be called'))));
});

describe('POST /api/users/register', () => {
  it('returns 201 for a new user', async () => {
    const selectMock = vi.fn().mockResolvedValue({ rows: [] });
    const insertMock = vi.fn().mockResolvedValue({
      rows: [
        {
          id: 'user-1',
          phone_number: '09171234567',
          full_name: 'Test Fisher',
          home_port_name: 'Mercedes Fish Port',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    });
    const query = vi.fn((sql: string, _params?: unknown[]) =>
      sql.includes('SELECT') ? selectMock(sql) : insertMock(sql)
    );
    getDbPoolMock.mockReturnValue({ query } as never);

    const res = await POST(postJson(validBody));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.phone_number).toBe('09171234567');
    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it('returns 409 for a duplicate and never overwrites', async () => {
    const insertMock = vi.fn();
    const query = vi.fn().mockResolvedValue({ rows: [{ id: 'existing-id' }] });
    getDbPoolMock.mockReturnValue({ query } as never);
    // Wire the INSERT spy through the same query fn for the no-overwrite assertion.
    query.mockImplementation((sql: string) => {
      if (sql.trimStart().startsWith('INSERT')) insertMock(sql);
      return Promise.resolve({ rows: [{ id: 'existing-id' }] });
    });

    const res = await POST(postJson(validBody));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/already exists/i);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('maps a unique-violation race to 409', async () => {
    const query = vi.fn((sql: string) => {
      if (sql.includes('SELECT')) return Promise.resolve({ rows: [] });
      return Promise.reject(Object.assign(new Error('duplicate'), { code: '23505' }));
    });
    getDbPoolMock.mockReturnValue({ query } as never);

    const res = await POST(postJson(validBody));
    expect(res.status).toBe(409);
  });

  it('returns 400 for a bad phone number', async () => {
    getDbPoolMock.mockReturnValue(null);
    const res = await POST(postJson({ ...validBody, phone_number: '12345' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/phone_number/i);
  });

  it('returns 400 for bad geo', async () => {
    getDbPoolMock.mockReturnValue(null);
    const badLat = await POST(postJson({ ...validBody, latitude: 91 }));
    expect(badLat.status).toBe(400);
    const badLatBody = await badLat.json();
    expect(badLatBody.error).toMatch(/latitude/i);

    const badLng = await POST(postJson({ ...validBody, longitude: 200 }));
    expect(badLng.status).toBe(400);

    const missing = await POST(postJson({ phone_number: '09171234567' }));
    expect(missing.status).toBe(400);
  });
});
