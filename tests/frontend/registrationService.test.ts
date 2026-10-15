import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({ getSession: vi.fn(), setSession: vi.fn(), signOut: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: sdk, from: sdk.from } }));
import { authHeaders } from '@/utils/auth-fetch';
import { confirmedOwner, loadMessagingConsent, loadOwnerProfile, normalizedPhone, persistOwnerProfile, persistRegistration,
  requestRegistrationCode, saveMessagingConsent, verifyRegistrationCode } from '@/services/registrationService';
import type { User } from '@supabase/supabase-js';

const owner = { id: 'owner-a', phone: '639171234567', phone_confirmed_at: '2026-10-15T00:00:00Z' } as User;
const input = { phone_number: '0917 123 4567', full_name: 'Test Fisher', home_port_name: 'Chosen port', latitude: 0, longitude: 0,
  messaging_consent: false, consent_version: 'server-version' };
const savedConsent = { messaging_consent: false, messaging_consent_version: 'server-version', messaging_consent_at: '2026-10-15T00:00:00Z' };
const registration = { ...savedConsent, id: 'profile-a', status: 'registered', contact_verified: true,
  phone_number: '+639171234567', full_name: input.full_name, home_port_name: input.home_port_name };
const fetchMock = vi.fn();
function reply(data: unknown, status = 200, headers: Record<string, string> = {}) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } }));
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockRejectedValue(new Error('Unmocked fetch is forbidden'));
  sdk.getSession.mockResolvedValue({ data: { session: { access_token: 'mock-owner-token', user: owner } }, error: null });
  sdk.setSession.mockResolvedValue({ data: { session: { access_token: 'mock-owner-token' }, user: owner }, error: null });
  sdk.signOut.mockResolvedValue({ error: null });
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('OTP and Supabase session contract (all transports mocked)', () => {
  it('normalizes allowed phone formats and rejects malformed input', () => {
    for (const phone of ['0917 123 4567', '9171234567', '+63 (917) 123-4567', '639171234567']) expect(normalizedPhone(phone)).toBe('+639171234567');
    expect(() => normalizedPhone('not a phone')).toThrow();
    expect(() => confirmedOwner({ ...owner, phone_confirmed_at: undefined })).toThrow();
  });
  it('requests only the contract fields without a token, never retries or produces a demo code', async () => {
    reply({ status: 'code_requested' }, 202);
    await requestRegistrationCode(input.phone_number);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [path, options] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/auth/otp/request');
    expect(JSON.parse(options.body)).toEqual({ phone_number: '+639171234567' });
    expect(options.headers.Authorization).toBeUndefined();
    expect(options.cache).toBe('no-store');
  });
  it('preserves a leading zero code and establishes the actual returned session', async () => {
    reply({ status: 'phone_verified', user: { id: owner.id, phone_number: '+639171234567' }, session: { access_token: 'access', refresh_token: 'refresh' } });
    await verifyRegistrationCode(input.phone_number, '012345');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).code).toBe('012345');
    expect(sdk.setSession).toHaveBeenCalledWith({ access_token: 'access', refresh_token: 'refresh' });
  });
  it('rejects invalid or reused codes and never establishes a session', async () => {
    await expect(verifyRegistrationCode(input.phone_number, '12345')).rejects.toThrow('six-digit');
    expect(fetchMock).not.toHaveBeenCalled();
    reply({ error: 'Expired or reused code' }, 400);
    await expect(verifyRegistrationCode(input.phone_number, '482910')).rejects.toMatchObject({ status: 400 });
    expect(sdk.setSession).not.toHaveBeenCalled();
  });
  it('rejects a mismatched verification response before setting a session', async () => {
    reply({ status: 'phone_verified', user: { id: owner.id, phone_number: '+639181234567' }, session: { access_token: 'access', refresh_token: 'refresh' } });
    await expect(verifyRegistrationCode(input.phone_number, '012345')).rejects.toThrow('matching');
    expect(sdk.setSession).not.toHaveBeenCalled();
  });
  it.each(['failed session', 'wrong owner', 'unconfirmed owner', 'missing SDK method'])('fails closed for %s', async kind => {
    reply({ status: 'phone_verified', user: { id: owner.id, phone_number: '+639171234567' }, session: { access_token: 'access', refresh_token: 'refresh' } });
    if (kind === 'failed session') sdk.setSession.mockResolvedValue({ data: { session: null, user: null }, error: new Error('rejected') });
    if (kind === 'wrong owner') sdk.setSession.mockResolvedValue({ data: { session: {}, user: { ...owner, id: 'owner-b' } }, error: null });
    if (kind === 'unconfirmed owner') sdk.setSession.mockResolvedValue({ data: { session: {}, user: { ...owner, phone_confirmed_at: null } }, error: null });
    if (kind === 'missing SDK method') sdk.setSession.mockRejectedValue(new TypeError('setSession unavailable'));
    await expect(verifyRegistrationCode(input.phone_number, '012345')).rejects.toMatchObject({ status: 401 });
    expect(sdk.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('honors both Retry-After encodings and performs no automatic OTP retry', async () => {
    reply({ error: 'Slow down' }, 429, { 'Retry-After': '30' });
    await expect(requestRegistrationCode(input.phone_number)).rejects.toMatchObject({ status: 429, retryAt: expect.any(Number) });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const date = new Date(Date.now() + 60000).toUTCString();
    reply({}, 429, { 'Retry-After': date });
    await expect(requestRegistrationCode(input.phone_number)).rejects.toMatchObject({ retryAt: Date.parse(date) });
  });
});

describe('registration, profile and consent persistence', () => {
  it('uses the current bearer token; missing and failed sessions cannot fall back to anonymous writes', async () => {
    expect(await authHeaders()).toEqual({ Authorization: 'Bearer mock-owner-token' });
    sdk.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(persistRegistration(input)).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
    sdk.getSession.mockResolvedValue({ data: { session: { access_token: 'old' } }, error: new Error('expired') });
    await expect(authHeaders()).rejects.toThrow('session');
  });
  it.each([false, true])('saves an explicit %s choice, preserves zero coordinates, and omits scheduling/password/helper fields', async choice => {
    reply({ ...registration, messaging_consent: choice }, 201);
    const result = await persistRegistration({ ...input, messaging_consent: choice });
    expect(result).toMatchObject({ id: 'profile-a', licenseNo: '', lat: 0, lng: 0, phone: '+639171234567' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ ...input, phone_number: '+639171234567', messaging_consent: choice });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer mock-owner-token');
  });
  it.each([400, 401, 403, 409, 429, 503])('does not claim saved registration for HTTP %i or retry it', async status => {
    reply({ error: 'specific server error' }, status);
    await expect(persistRegistration(input)).rejects.toMatchObject({ status, message: 'specific server error' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('keeps timeout/network outcomes uncertain and has no local or FastAPI fallback', async () => {
    await expect(persistRegistration(input)).rejects.toThrow('may have completed');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/users/register');
  });
  it('aborts a timed-out mutation once and reports an uncertain persistence outcome', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce((_path, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
    }));
    const outcome = expect(persistRegistration(input)).rejects.toThrow('may have completed');
    await vi.advanceTimersByTimeAsync(12001);
    await outcome;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it('rejects malformed acknowledgements, nonnumeric coordinates and missing explicit choice', async () => {
    reply({ ...registration, contact_verified: false }, 201);
    await expect(persistRegistration(input)).rejects.toThrow('acknowledgement');
    await expect(persistRegistration({ ...input, latitude: NaN })).rejects.toThrow('Enter your name');
    await expect(persistRegistration({ ...input, messaging_consent: undefined! })).rejects.toThrow('explicit');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('loads server text/version and treats consent before registration as unrecorded', async () => {
    reply({ consent_version: 'server-version', consent_text: 'Exact server copy', consent: null });
    expect(await loadMessagingConsent(owner.id)).toEqual({ consent_version: 'server-version', consent_text: 'Exact server copy', consent: null });
    reply({ consent_version: 'server-version', consent: null });
    await expect(loadMessagingConsent(owner.id)).rejects.toThrow('could not be loaded');
  });
  it('withdraws consent with its current version without removing the account', async () => {
    reply({ ...savedConsent, messaging_eligible: false });
    expect(await saveMessagingConsent(false, 'server-version', owner.id)).toEqual({ ...savedConsent, messaging_eligible: false });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/users/consent');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ messaging_consent: false, consent_version: 'server-version' });
    expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
  });
  it('cannot apply the displayed consent choice to a different session owner', async () => {
    sdk.getSession.mockResolvedValue({ data: { session: { access_token: 'other-owner-token', user: { id: 'owner-b' } } }, error: null });
    await expect(saveMessagingConsent(true, 'server-version', owner.id)).rejects.toMatchObject({ status: 401 });
    await expect(loadMessagingConsent(owner.id)).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('does not acknowledge a stale consent version, wrong saved choice or missing timestamp', async () => {
    reply({ error: 'Stale consent version' }, 409);
    await expect(saveMessagingConsent(true, 'old-version', owner.id)).rejects.toMatchObject({ status: 409 });
    reply({ ...savedConsent, messaging_consent: true });
    await expect(saveMessagingConsent(false, 'server-version', owner.id)).rejects.toThrow('not confirmed');
    reply({ ...savedConsent, messaging_consent_at: null });
    await expect(saveMessagingConsent(false, 'server-version', owner.id)).rejects.toThrow('not confirmed');
  });
  it('reads only the current RLS owner and never invents coordinates or legacy licence details', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'profile-a', auth_user_id: owner.id, phone_number: '+639171234567', phone_verified_at: 'confirmed', full_name: 'Test', home_port_name: 'Saved port' }, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    sdk.from.mockReturnValue({ select: () => ({ eq }) });
    const profile = await loadOwnerProfile(owner);
    expect(eq).toHaveBeenCalledWith('auth_user_id', owner.id);
    expect(profile?.lat).toBeNaN(); expect(profile?.lng).toBeNaN(); expect(profile?.licenseNo).toBe('');
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(await loadOwnerProfile(owner)).toBeNull();
    maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('database unavailable') });
    await expect(loadOwnerProfile(owner)).rejects.toThrow('could not be loaded');
    maybeSingle.mockResolvedValueOnce({ data: { id: 'other', auth_user_id: 'owner-b' }, error: null });
    await expect(loadOwnerProfile(owner)).rejects.toThrow('does not match');
  });
  it('updates a port only after server acknowledgement and never resets advisory time', async () => {
    const profile = { id: 'profile-a', phone: input.phone_number, vesselName: input.full_name, port: input.home_port_name,
      lat: 0, lng: 0, licenseNo: '', boatType: '', speciesPreference: 'pelagic' as const };
    reply({ id: profile.id, phone_number: '+639171234567', full_name: input.full_name, home_port_name: input.home_port_name, latitude: 0, longitude: 0 });
    expect(await persistOwnerProfile(profile)).toMatchObject({ lat: 0, lng: 0 });
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload).not.toHaveProperty('preferred_advisory_time');
    expect(payload).not.toHaveProperty('messaging_consent');
    reply({ error: 'Unavailable' }, 503);
    await expect(persistOwnerProfile(profile)).rejects.toMatchObject({ status: 503 });
  });
});
