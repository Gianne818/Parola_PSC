import { NextResponse } from 'next/server';
import { smsService } from '@/services/smsServiceInstance';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipient, message, category } = body;

    if (!recipient || !message) {
      return NextResponse.json(
        { error: 'recipient and message are required fields.' },
        { status: 400 }
      );
    }

    const result = await smsService.sendSms({ recipient, message, category });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'SMS Dispatch failed.' },
      { status: 500 }
    );
  }
}
