import { NextResponse } from 'next/server';
// @ts-ignore
import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (pool) return pool;
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!dbUrl) return null;

  pool = new Pool({
    connectionString: dbUrl.replace('?pgbouncer=true', ''),
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone_number = searchParams.get('phone_number');

    if (!phone_number) {
      return NextResponse.json({ error: 'phone_number parameter is required' }, { status: 400 });
    }

    const cleanedPhone = phone_number.trim();

    // 1. Direct query to Supabase PostgreSQL database
    const db = getPool();
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
      } catch (dbErr: any) {
        console.warn('[By-Phone API] PostgreSQL query warning:', dbErr.message);
      }
    }

    // 2. Fallback to external backend server if configured
    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${apiUrl}/api/users/by-phone?phone_number=${encodeURIComponent(cleanedPhone)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (apiErr) {
      console.warn('[By-Phone API] External API unreachable:', apiErr);
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Backend server error', details: err.message },
      { status: 500 }
    );
  }
}
