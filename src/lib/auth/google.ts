/**
 * Google OAuth 2.0 helper for server-side verification.
 * Uses google-auth-library to validate ID tokens.
 */
import { OAuth2Client } from 'google-auth-library';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const client = new OAuth2Client(googleClientId);

export async function verifyGoogleIdToken(idToken: string): Promise<{ email: string; name?: string; avatarUrl?: string } | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload) return null;
    return {
      email: payload.email!,
      name: payload.name,
      avatarUrl: payload.picture,
    };
  } catch {
    return null;
  }
}

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dc-agentpay-x.vercel.app'}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
