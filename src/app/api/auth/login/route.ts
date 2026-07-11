import { NextRequest, NextResponse } from 'next/server';
import { verifySignature } from '@/lib/auth/metaMask';
import { generateToken, type JWTPayload } from '@/lib/auth/jwt';

/**
 * MetaMask / Google login endpoint.
 *
 * DESIGN: This endpoint intentionally does NOT depend on MongoDB.
 * - MetaMask: wallet address IS the user ID → JWT signed → done.
 * - Google: verified email IS the user ID → JWT signed → done.
 *
 * DB persistence (user profile enrichment) happens lazily on first
 * data-write API call and never blocks login. This means users can
 * always log in even if MongoDB is misconfigured or unreachable.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method } = body;

    // ================== MetaMask ==================
    if (method === 'metamask') {
      const { address, message, signature } = body;

      const missing: string[] = [];
      if (!address)   missing.push('address');
      if (!message)   missing.push('message');
      if (!signature) missing.push('signature');
      if (missing.length) {
        return NextResponse.json({
          ok: false,
          error: `Missing MetaMask fields: ${missing.join(', ')}. The client must call /api/auth/nonce first and then sign the returned message.`,
        }, { status: 400 });
      }

      if (!verifySignature(message, signature, address)) {
        return NextResponse.json({
          ok: false,
          error: 'Invalid signature — recovered address does not match',
        }, { status: 401 });
      }

      const normalized = address.toLowerCase();
      const userId = 'wallet_' + normalized.slice(2, 14);
      const email  = normalized.slice(0, 8) + '@metamask.eth';
      const name   = 'Agent ' + normalized.slice(2, 8);

      const token = generateToken({
        userId,
        email,
        loginMethod: 'metamask',
        metamaskAddress: normalized,
      } as JWTPayload);

      // Fire-and-forget upsert to Mongo (never blocks login response)
      upsertUserSafely({
        _id: userId,
        email, name,
        loginMethod: 'metamask',
        metamaskAddress: normalized,
      });

      return NextResponse.json({
        ok: true,
        user: { id: userId, email, name, loginMethod: 'metamask', metamaskAddress: normalized },
        token,
      });
    }

    // ================== Google ==================
    if (method === 'google') {
      const { idToken } = body;
      if (!idToken) {
        return NextResponse.json({ ok: false, error: 'Missing Google idToken' }, { status: 400 });
      }

      const { verifyGoogleIdToken } = await import('@/lib/auth/google');
      const profile = await verifyGoogleIdToken(idToken);
      if (!profile) {
        return NextResponse.json({ ok: false, error: 'Invalid Google token' }, { status: 401 });
      }

      const userId = 'google_' + Buffer.from(profile.email).toString('base64').replace(/=/g, '').slice(0, 20);

      const token = generateToken({
        userId,
        email: profile.email,
        loginMethod: 'google',
      } as JWTPayload);

      upsertUserSafely({
        _id: userId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        loginMethod: 'google',
      });

      return NextResponse.json({
        ok: true,
        user: {
          id: userId,
          email: profile.email,
          name: profile.name,
          loginMethod: 'google',
        },
        token,
      });
    }

    return NextResponse.json({ ok: false, error: `Unknown auth method: ${method}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Login error' }, { status: 500 });
  }
}

/**
 * Best-effort user upsert to MongoDB.
 * Never throws — MongoDB errors are logged but never propagate to the client.
 */
async function upsertUserSafely(user: any) {
  try {
    const { getDb } = await import('@/lib/db/mongo');
    const db = await getDb();
    const users = db.collection('users');
    await users.updateOne(
      { _id: user._id },
      { $set: { ...user, updatedAt: Date.now() }, $setOnInsert: { createdAt: Date.now() } } as any,
      { upsert: true } as any,
    );
  } catch (e: any) {
    console.warn('[login] user upsert failed (non-fatal):', e?.message);
  }
}
