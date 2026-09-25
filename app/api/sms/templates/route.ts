import { NextResponse } from 'next/server';
import { FISHERMAN_ALERT_TEMPLATES } from '@/templates/fishermanAlerts';

export async function GET() {
  return NextResponse.json(
    {
      templates: Object.values(FISHERMAN_ALERT_TEMPLATES),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } }
  );
}
