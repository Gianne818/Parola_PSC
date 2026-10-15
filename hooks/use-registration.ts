'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { confirmedOwner, emptyOwnerProfile, loadOwnerProfile, normalizedPhone, persistOwnerProfile, persistRegistration,
  verifyRegistrationCode, type RegistrationInput } from '@/services/registrationService';

export function useRegistration() {
  const [initialized, setInitialized] = useState(false);
  const [owner, setOwner] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(emptyOwnerProfile);
  const [profileStatus, setProfileStatus] = useState<'loading' | 'missing' | 'saved' | 'error'>('loading');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const epoch = useRef(0);
  const ownerId = useRef<string | null>(null);
  const ownerPhone = useRef<string | null>(null);

  const reloadRegistration = useCallback(async () => {
    const revision = ++epoch.current;
    let verified = false;
    // Same-owner token refresh/refocus must not temporarily sign out protected pages.
    setProfileStatus(previous => previous === 'saved' ? previous : 'loading');
    setSessionError(null);
    try {
      const current = await supabase.auth.getSession();
      if (current.error) throw new Error('Session could not be restored. Verify your phone again.');
      if (!current.data.session) {
        if (revision === epoch.current) {
          ownerId.current = null; setOwner(null); setProfile(emptyOwnerProfile); setProfileStatus('missing');
        }
        return;
      }
      // Restored storage/JWT metadata alone cannot confirm authoritative phone ownership.
      const result = await supabase.auth.getUser(current.data.session.access_token);
      if (result.error) throw new Error('Session could not be confirmed. Verify your phone again.');
      const user = confirmedOwner(result.data.user);
      verified = true;
      if (revision !== epoch.current) return;
      const sameOwner = ownerId.current === user.id;
      ownerId.current = user.id;
      ownerPhone.current = normalizedPhone(user.phone!);
      setOwner(user);
      if (!sameOwner) setProfile({ ...emptyOwnerProfile, phone: user.phone! });
      const saved = await loadOwnerProfile(user);
      if (revision !== epoch.current) return;
      setProfile(previous => saved ? { ...saved,
        ...(sameOwner && previous.id === saved.id && previous.port === saved.port ? { lat: previous.lat, lng: previous.lng } : {}) }
        : { ...emptyOwnerProfile, phone: user.phone! });
      setProfileStatus(saved ? 'saved' : 'missing');
      return saved;
    } catch (error) {
      if (revision === epoch.current) {
        if (!verified) { ownerId.current = null; setOwner(null); setProfile(emptyOwnerProfile); }
        setProfileStatus('error');
        setSessionError(error instanceof Error ? error.message : 'Account could not be loaded. Retry.');
      }
      throw error;
    } finally { if (revision === epoch.current) setInitialized(true); }
  }, []);

  useEffect(() => {
    let active = true;
    const generation = epoch;
    let subscription: { unsubscribe: () => void } | undefined;
    try { subscription = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        ++epoch.current; ownerId.current = null; ownerPhone.current = null;
        setOwner(null); setProfile(emptyOwnerProfile); setProfileStatus('missing'); setSessionError(null); setInitialized(true);
      } else {
        let samePhone = false;
        try { samePhone = !!session?.user.phone && normalizedPhone(session.user.phone) === ownerPhone.current; } catch { /* An invalid phone clears the previous owner. */ }
        if (session && (session.user.id !== ownerId.current || !samePhone)) {
          ++epoch.current; ownerId.current = null; ownerPhone.current = null;
          setOwner(null); setProfile(emptyOwnerProfile); setProfileStatus('loading');
        }
        // Leave the Supabase auth callback before awaiting any auth operations.
        queueMicrotask(() => { if (active) void reloadRegistration().catch(() => {}); });
      }
    }).data.subscription; }
    catch {
      queueMicrotask(() => {
        if (active) { setProfileStatus('error'); setSessionError('Supabase authentication is unavailable. Account access was not established.'); setInitialized(true); }
      });
    }
    queueMicrotask(() => { if (active) void reloadRegistration().catch(() => {}); });
    return () => { active = false; ++generation.current; subscription?.unsubscribe(); };
  }, [reloadRegistration]);

  const verifyCode = async (phone: string, code: string) => {
    await verifyRegistrationCode(phone, code);
    return reloadRegistration();
  };
  const register = async (input: RegistrationInput) => {
    const revision = epoch.current;
    if (!ownerId.current || profileStatus !== 'missing') throw new Error('Verify your own phone and check the saved account before creating an account.');
    const saved = await persistRegistration(input);
    if (revision !== epoch.current) throw new Error('Session changed. Reload your account to check whether registration saved.');
    setProfile(saved); setProfileStatus('saved'); setSessionError(null);
  };
  const updateProfile = async (patch: Partial<UserProfile>) => {
    const revision = epoch.current;
    if (!ownerId.current || profileStatus !== 'saved') throw new Error('Load your saved owner account before editing.');
    const saved = await persistOwnerProfile({ ...profile, ...patch });
    if (revision !== epoch.current) throw new Error('Session changed. Reload to confirm the profile save.');
    setProfile(saved);
  };
  const logout = async () => {
    ++epoch.current; ownerId.current = null; ownerPhone.current = null;
    setOwner(null); setProfile(emptyOwnerProfile); setProfileStatus('missing');
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setSessionError(null);
      return true;
    } catch {
      setProfileStatus('error');
      setSessionError('Sign-out could not clear the stored Supabase session. Retry sign-out before switching accounts.');
      return false;
    }
  };
  return { initialized, owner, profile, profileStatus, sessionError, reloadRegistration, verifyCode, register, updateProfile, logout };
}
