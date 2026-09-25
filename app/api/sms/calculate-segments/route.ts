import { NextResponse } from 'next/server';
import { calculateSmsSegments, sanitizePhilippineMobileNumber } from '@/services/iprogSmsService';

const MAX_MESSAGE_CHARS = 5000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    const { message, recipient } = body as { message?: unknown; recipient?: unknown };

    if (typeof message !== 'string' || !message) {
      return NextResponse.json({ error: 'message is required.' }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        { error: `message must be at most ${MAX_MESSAGE_CHARS} characters.` },
        { status: 400 }
      );
    }

    const segments = calculateSmsSegments(message);

    let recipientFormatted = null;
    let recipientError = null;

    if (recipient !== undefined) {
      if (typeof recipient !== 'string' || !recipient.trim()) {
        recipientError = 'Invalid recipient format.';
      } else {
        try {
          recipientFormatted = sanitizePhilippineMobileNumber(recipient);
        } catch {
          recipientError = 'Invalid Philippines mobile number format. Expected 09XXXXXXXXX or 639XXXXXXXXX.';
        }
      }
    }

    return NextResponse.json({
      ...segments,
      recipientFormatted,
      recipientError,
    });
  } catch {
    console.error('[SMS Segments API] computation failed');
    return NextResponse.json({ error: 'Segment calculation failed.' }, { status: 500 });
  }
}
