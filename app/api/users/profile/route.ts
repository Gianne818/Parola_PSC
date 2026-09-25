import { NextResponse } from 'next/server';
import { requireOwnerOrAdmin } from '@/lib/route-auth';

export async function PUT(request: Request) {
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

    const denied = await requireOwnerOrAdmin(request, phone_number);
    if (denied) return denied;

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

    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    const backendApiKey = process.env.PAROLA_API_KEY || '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response: Response;
    try {
      response = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(backendApiKey ? { 'X-API-Key': backendApiKey } : {}),
        },
        body: JSON.stringify({
          phone_number,
          full_name: full_name || 'Captain',
          home_port_name: home_port_name || 'Municipal Port',
          latitude: lat,
          longitude: lng,
          preferred_advisory_time: preferred_advisory_time || '05:00:00',
          coop_id: coop_id || null,
          password: password || undefined,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as Record<string, unknown>));
      const detail = typeof errorData.detail === 'string' ? errorData.detail : 'Failed to update user profile';
      return NextResponse.json({ error: detail }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch {
    console.error('[Profile API] update failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
