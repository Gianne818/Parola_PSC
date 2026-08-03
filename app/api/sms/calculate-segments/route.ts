import { NextResponse } from 'next/server';
import { calculateSmsSegments, sanitizePhilippineMobileNumber } from '@/services/iprogSmsService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, recipient } = body;

    if (!message) {
      return NextResponse.json({ error: 'message is required.' }, { status: 400 });
    }

    const segments = calculateSmsSegments(message);

    let recipientFormatted = null;
    let recipientError = null;

    if (recipient) {
      try {
        recipientFormatted = sanitizePhilippineMobileNumber(recipient);
      } catch (err: any) {
        recipientError = err.message;
      }
    }

    return NextResponse.json({
      ...segments,
      recipientFormatted,
      recipientError,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
