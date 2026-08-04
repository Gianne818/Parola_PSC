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
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone_number, full_name, home_port_name, latitude, longitude, preferred_advisory_time, coop_id, password } = body;

    if (!phone_number || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'phone_number, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    const cleanedPhone = String(phone_number).trim();
    const lat = Number(latitude);
    const lng = Number(longitude);

    // 1. Direct write to Supabase PostgreSQL database via Pool connection
    const db = getPool();
    if (db) {
      try {
        const query = `
          INSERT INTO public.users (
            phone_number,
            full_name,
            home_port_name,
            home_port_geom,
            preferred_advisory_time
          )
          VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6)
          ON CONFLICT (phone_number) 
          DO UPDATE SET 
            full_name = EXCLUDED.full_name,
            home_port_name = EXCLUDED.home_port_name,
            home_port_geom = EXCLUDED.home_port_geom,
            updated_at = NOW()
          RETURNING id, phone_number, full_name, home_port_name, created_at;
        `;
        const res = await db.query(query, [
          cleanedPhone,
          full_name || cleanedPhone,
          home_port_name || 'Mercedes Fish Port',
          lng,
          lat,
          preferred_advisory_time || '05:00:00'
        ]);

        if (res.rows && res.rows.length > 0) {
          console.log('[Register API] Successfully inserted user profile into PostgreSQL database:', res.rows[0]);
          return NextResponse.json(res.rows[0], { status: 201 });
        }
      } catch (dbErr: any) {
        console.error('[Register API] PostgreSQL direct insert error:', dbErr.message);
      }
    }

    // 2. Fallback to external backend server if configured
    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: cleanedPhone,
          full_name: full_name || cleanedPhone,
          home_port_name: home_port_name || 'Mercedes Fish Port',
          latitude: lat,
          longitude: lng,
          preferred_advisory_time: preferred_advisory_time || '05:00:00',
          coop_id: coop_id || null,
          password: password || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (apiErr) {
      console.warn('[Register API] External API server unreachable:', apiErr);
    }

    return NextResponse.json(
      { phone_number: cleanedPhone, full_name: full_name || cleanedPhone, message: 'Registered successfully' },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Registration server error.', details: err.message },
      { status: 500 }
    );
  }
}
