import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongo';
import { generateToken, type JWTPayload } from '@/lib/auth/jwt';
import { uid } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/zh-TW', req.headers.get('referer') || 'https://dc-agentpay-x.vercel.app'));
    }

    // Exchange code for tokens (server-side)
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dc-agentpay-x.vercel.app'}/api/auth/callback`,
      }),
    });

    const tokens = await response.json();
    if (!response.ok) {
      throw new Error(tokens.error_description || 'Google token exchange failed');
    }

    const idToken = tokens.id_token;
    const { verifyGoogleIdToken } = await import('@/lib/auth/google');
    const profile = await verifyGoogleIdToken(idToken);
    if (!profile) {
      throw new Error('Failed to verify Google profile');
    }

    const db = await getDb();
    const users = db.collection('users');
    let user = await users.findOne({ email: profile.email });
    if (!user) {
      user = {
        _id: uid(),
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        loginMethod: 'google',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await users.insertOne(user);
    }

    const token = generateToken({
      userId: user._id!.toString(),
      email: user.email,
      loginMethod: 'google',
    } as JWTPayload);

    // Redirect with token in URL (client reads and stores in zustand)
    const redirectUrl = new URL(`/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'zh-TW'}/dashboard`, 'https://dc-agentpay-x.vercel.app');
    redirectUrl.searchParams.set('token', token);
    return NextResponse.redirect(redirectUrl);
  } catch (e: any) {
    const redirectUrl = new URL(`/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'zh-TW'}`, 'https://dc-agentpay-x.vercel.app');
    redirectUrl.searchParams.set('error', e.message);
    return NextResponse.redirect(redirectUrl);
  }
}
