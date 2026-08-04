import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const min_probability = searchParams.get('min_probability') || '0.50';
    const limit = searchParams.get('limit') || '5';

    if (!lat || !lon) {
      return NextResponse.json({ error: 'lat and lon parameters are required' }, { status: 400 });
    }

    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    const response = await fetch(
      `${apiUrl}/api/advisories/nearest?lat=${lat}&lon=${lon}&min_probability=${min_probability}&limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
