import { NextRequest, NextResponse } from 'next/server';
import { getMarketTicker } from '@/lib/htx/client';

export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get('symbol') || 'btcusdt';
  try {
    const data = await getMarketTicker(symbol);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
