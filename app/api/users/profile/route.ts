import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { phone_number, full_name, home_port_name, latitude, longitude, preferred_advisory_time, coop_id, password } = body;

    if (!phone_number || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'phone_number, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number,
        full_name: full_name || 'Captain',
        home_port_name: home_port_name || 'Municipal Port',
        latitude: Number(latitude),
        longitude: Number(longitude),
        preferred_advisory_time: preferred_advisory_time || '05:00:00',
        coop_id: coop_id || null,
        password: password || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to update user profile' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
