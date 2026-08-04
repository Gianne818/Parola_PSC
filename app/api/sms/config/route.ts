import { NextResponse } from 'next/server';
import { smsService } from '@/services/smsServiceInstance';

export async function GET() {
  const currentConfig = smsService.getConfig();
  // Mask API key for security
  const maskedApiKey = currentConfig.apiKey
    ? currentConfig.apiKey.substring(0, 4) + '...' + currentConfig.apiKey.slice(-4)
    : 'NOT_SET';

  return NextResponse.json({
    endpoint: currentConfig.endpoint,
    senderName: currentConfig.senderName,
    mockMode: currentConfig.mockMode,
    apiKeyMasked: maskedApiKey,
    remainingFreeQuota: currentConfig.mockMode ? 5 : 'LIVE_QUOTA',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mockMode, apiKey, senderName, endpoint } = body;

    smsService.updateConfig({
      ...(typeof mockMode === 'boolean' ? { mockMode } : {}),
      ...(apiKey ? { apiKey } : {}),
      ...(senderName ? { senderName } : {}),
      ...(endpoint ? { endpoint } : {}),
    });

    const updated = smsService.getConfig();
    return NextResponse.json({
      success: true,
      message: 'iPROG Gateway Configuration updated dynamically.',
      config: {
        endpoint: updated.endpoint,
        senderName: updated.senderName,
        mockMode: updated.mockMode,
        apiKeyMasked: updated.apiKey ? updated.apiKey.substring(0, 4) + '...' : 'NOT_SET',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
