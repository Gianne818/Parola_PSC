import { NextResponse } from 'next/server';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { getDbPool } from '@/lib/db';

function isValidPhilippinePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return /^(63\d{10}|09\d{9}|9\d{9})$/.test(digits);
}

function isValidTime(value: unknown): boolean {
  return typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

/** Match FastAPI hash_password(): salt$pbkdf2-sha256-100k-hex */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const key = pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return `${salt}$${key}`;
}

function isRemotePlainHttp(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    const { phone_number, full_name, home_port_name, latitude, longitude, preferred_advisory_time, coop_id, password } = body as {
      phone_number?: unknown;
      full_name?: unknown;
      home_port_name?: unknown;
      latitude?: unknown;
      longitude?: unknown;
      preferred_advisory_time?: unknown;
      coop_id?: unknown;
      password?: unknown;
    };

    if (typeof phone_number !== 'string' || !phone_number.trim()) {
      return NextResponse.json(
        { error: 'phone_number, latitude, and longitude are required' },
        { status: 400 }
      );
    }
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'phone_number, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    const cleanedPhone = phone_number.trim();
    if (cleanedPhone.length > 32 || !isValidPhilippinePhone(cleanedPhone)) {
      return NextResponse.json({ error: 'phone_number must be a valid Philippine mobile number.' }, { status: 400 });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return NextResponse.json({ error: 'latitude must be between -90 and 90.' }, { status: 400 });
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'longitude must be between -180 and 180.' }, { status: 400 });
    }
    if (full_name !== undefined && (typeof full_name !== 'string' || full_name.length > 100)) {
      return NextResponse.json({ error: 'full_name must be at most 100 characters.' }, { status: 400 });
    }
    if (home_port_name !== undefined && (typeof home_port_name !== 'string' || home_port_name.length > 100)) {
      return NextResponse.json({ error: 'home_port_name must be at most 100 characters.' }, { status: 400 });
    }
    if (password !== undefined && (typeof password !== 'string' || password.length < 6 || password.length > 128)) {
      return NextResponse.json({ error: 'password must be 6-128 characters.' }, { status: 400 });
    }

    const safeFullName = (typeof full_name === 'string' && full_name.trim() ? full_name.trim() : cleanedPhone).slice(0, 100);
    const safePortName = (typeof home_port_name === 'string' && home_port_name.trim() ? home_port_name.trim() : 'Mercedes Fish Port').slice(0, 100);
    const safeTime = isValidTime(preferred_advisory_time) ? (preferred_advisory_time as string) : '05:00:00';
    const passwordHash = typeof password === 'string' && password ? hashPassword(password) : null;

    // 1. Direct write to Supabase PostgreSQL — create-only, never overwrite.
    const db = getDbPool(5);
    if (db) {
      try {
        const existing = await db.query('SELECT id FROM public.users WHERE phone_number = $1 LIMIT 1;', [cleanedPhone]);
        if (existing.rows && existing.rows.length > 0) {
          return NextResponse.json(
            { error: 'An account with this phone number already exists. Please sign in instead.' },
            { status: 409 }
          );
        }

        try {
          const res = await db.query(
            `INSERT INTO public.users (
              phone_number, full_name, home_port_name, home_port_geom,
              preferred_advisory_time, password_hash
            )
            VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7)
            RETURNING id, phone_number, full_name, home_port_name, created_at;`,
            [cleanedPhone, safeFullName, safePortName, lng, lat, safeTime, passwordHash]
          );
          if (res.rows && res.rows.length > 0) {
            return NextResponse.json(res.rows[0], { status: 201 });
          }
        } catch (insertErr: unknown) {
          // Column may not exist on DBs created before the password_hash migration.
          const code = (insertErr as { code?: string } | null)?.code;
          if (code !== '42703') throw insertErr;
          const res = await db.query(
            `INSERT INTO public.users (
              phone_number, full_name, home_port_name, home_port_geom, preferred_advisory_time
            )
            VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6)
            RETURNING id, phone_number, full_name, home_port_name, created_at;`,
            [cleanedPhone, safeFullName, safePortName, lng, lat, safeTime]
          );
          if (res.rows && res.rows.length > 0) {
            return NextResponse.json(res.rows[0], { status: 201 });
          }
        }
      } catch (dbErr: unknown) {
        const code = (dbErr as { code?: string } | null)?.code;
        // Unique violation raced with the existence check → treat as duplicate.
        if (code === '23505') {
          return NextResponse.json(
            { error: 'An account with this phone number already exists. Please sign in instead.' },
            { status: 409 }
          );
        }
        console.error('[Register API] PostgreSQL insert failed');
      }
    }

    // 2. Fallback to external backend (it hashes + returns 409 on duplicates itself).
    // Never send passwords over remote plaintext HTTP.
    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    if (!isRemotePlainHttp(apiUrl)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let response: Response;
        try {
          response = await fetch(`${apiUrl}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone_number: cleanedPhone,
              full_name: safeFullName,
              home_port_name: safePortName,
              latitude: lat,
              longitude: lng,
              preferred_advisory_time: safeTime,
              coop_id: coop_id || null,
              password: password || undefined,
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (response.status === 409) {
          return NextResponse.json(
            { error: 'An account with this phone number already exists. Please sign in instead.' },
            { status: 409 }
          );
        }
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data, { status: 201 });
        }
      } catch {
        console.error('[Register API] External API server unreachable');
      }
    } else {
      console.error('[Register API] Refusing plaintext remote backend fallback');
    }

    // Fail closed: no false-positive success when nothing was created.
    if (!db) {
      return NextResponse.json({ error: 'Registration service unavailable.', offline: true }, { status: 503 });
    }
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 502 });
  } catch {
    console.error('[Register API] server error');
    return NextResponse.json({ error: 'Registration server error.' }, { status: 500 });
  }
}
