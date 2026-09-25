import { NextResponse } from 'next/server';
import { smsService } from '@/services/smsServiceInstance';
import { requireAdmin } from '@/lib/route-auth';

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const currentConfig = smsService.getConfig();

  return NextResponse.json({
    endpoint: currentConfig.endpoint,
    senderName: currentConfig.senderName,
    mockMode: currentConfig.mockMode,
    apiKeyConfigured: Boolean(currentConfig.apiKey),
    remainingFreeQuota: currentConfig.mockMode ? 5 : 'LIVE_QUOTA',
  });
}

const ALLOWED_ENDPOINT_PREFIX = 'https://sms.iprogtech.com/';

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    const { mockMode, apiKey, senderName, endpoint } = body as {
      mockMode?: unknown;
      apiKey?: unknown;
      senderName?: unknown;
      endpoint?: unknown;
    };

    if (endpoint !== undefined) {
      if (typeof endpoint !== 'string' || !endpoint.startsWith(ALLOWED_ENDPOINT_PREFIX)) {
        return NextResponse.json(
          { error: 'endpoint must be an https://sms.iprogtech.com/ URL.' },
          { status: 400 }
        );
      }
    }
    if (senderName !== undefined) {
      if (typeof senderName !== 'string' || senderName.length === 0 || senderName.length > 32) {
        return NextResponse.json(
          { error: 'senderName must be 1-32 characters.' },
          { status: 400 }
        );
      }
    }
    if (apiKey !== undefined && typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'apiKey must be a string.' }, { status: 400 });
    }

    smsService.updateConfig({
      ...(typeof mockMode === 'boolean' ? { mockMode } : {}),
      ...(typeof apiKey === 'string' && apiKey ? { apiKey } : {}),
      ...(typeof senderName === 'string' && senderName ? { senderName } : {}),
      ...(typeof endpoint === 'string' && endpoint ? { endpoint } : {}),
    });

    const updated = smsService.getConfig();
    return NextResponse.json({
      success: true,
      message: 'iPROG Gateway Configuration updated dynamically.',
      config: {
        endpoint: updated.endpoint,
        senderName: updated.senderName,
        mockMode: updated.mockMode,
        apiKeyConfigured: Boolean(updated.apiKey),
      },
    });
  } catch {
    console.error('[SMS Config API] update failed');
    return NextResponse.json({ error: 'Configuration update failed.' }, { status: 500 });
  }
}
