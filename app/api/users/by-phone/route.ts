import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone_number = searchParams.get('phone_number');

    if (!phone_number) {
      return NextResponse.json({ error: 'phone_number parameter is required' }, { status: 400 });
    }

    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/users/by-phone?phone_number=${encodeURIComponent(phone_number)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Backend server unavailable', offline: true, details: err.message },
      { status: 503 }
    );
  }
}
