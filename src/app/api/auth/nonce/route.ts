import { NextRequest, NextResponse } from 'next/server';
import { buildChallengeMessage } from '@/lib/auth/metaMask';

/**
 * Generates a signing challenge message for MetaMask login.
 * Client calls this before requesting a signature.
 */
export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ ok: false, error: 'Invalid address' }, { status: 400 });
    }
    const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const message = buildChallengeMessage(address, nonce);
    return NextResponse.json({ ok: true, nonce, message });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
