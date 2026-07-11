import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/auth/google';

export async function GET() {
  const state = Math.random().toString(36).slice(2);
  const url = getGoogleAuthUrl(state);
  return NextResponse.json({ ok: true, url });
}
