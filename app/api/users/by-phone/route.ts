import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireOwnerOrAdmin } from '@/lib/route-auth';
import { RATE_LIMITS, checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const limit = await checkRateLimit(request, RATE_LIMITS.byPhone);
    if (!limit.allowed) {
      return rateLimitExceededResponse(RATE_LIMITS.byPhone, limit, 'by-phone');
    }
    const { searchParams } = new URL(request.url);
    const phone_number = searchParams.get('phone_number');

    if (!phone_number || !phone_number.trim()) {
      return NextResponse.json({ error: 'phone_number parameter is required' }, { status: 400 });
    }

    const cleanedPhone = phone_number.trim();
    if (cleanedPhone.length > 32) {
      return NextResponse.json({ error: 'phone_number is too long.' }, { status: 400 });
    }

    const denied = await requireOwnerOrAdmin(request, cleanedPhone);
    if (denied) return denied;

    // 1. Direct query to Supabase PostgreSQL database
    const db = getDbPool(3);
    if (db) {
      try {
        const query = `
          SELECT id, phone_number, full_name, home_port_name, created_at
          FROM public.users
          WHERE phone_number = $1
          LIMIT 1;
        `;
        const res = await db.query(query, [cleanedPhone]);
        if (res.rows && res.rows.length > 0) {
          return NextResponse.json(res.rows[0]);
        }
      } catch {
        console.error('[By-Phone API] PostgreSQL query failed');
      }
    }

    // 2. Fallback to external backend server if configured
    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const backendApiKey = process.env.PAROLA_API_KEY || '';
      const response = await fetch(`${apiUrl}/api/users/by-phone?phone_number=${encodeURIComponent(cleanedPhone)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(backendApiKey ? { 'X-API-Key': backendApiKey } : {}),
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      console.error('[By-Phone API] External API unreachable');
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch {
    console.error('[By-Phone API] server error');
    return NextResponse.json({ error: 'Backend server error' }, { status: 500 });
  }
}
