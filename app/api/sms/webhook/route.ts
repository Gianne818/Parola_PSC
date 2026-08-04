import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone_number, message, message_id } = body;

    if (!phone_number || !message) {
      return NextResponse.json({ error: 'phone_number and message required' }, { status: 400 });
    }

    // Parse rating: 1 = High, 2 = Medium, 3 = Low catch
    const trimmed = message.trim();
    let feedbackValue = 2; // Default Medium
    if (trimmed.includes('1')) feedbackValue = 1;
    else if (trimmed.includes('3')) feedbackValue = 3;

    // Forward feedback to FastAPI service
    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: null,
        advisory_id: null,
        feedback_value: feedbackValue,
        raw_sms_body: message,
      }),
    });

    return NextResponse.json({ status: 'received', forwarded: response.ok });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
