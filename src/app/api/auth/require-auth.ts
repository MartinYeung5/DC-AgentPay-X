/**
 * Shared middleware to extract and verify JWT from request headers.
 */
import { NextRequest } from 'next/server';
import { verifyToken, type JWTPayload } from '@/lib/auth/jwt';

export function getAuthUser(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  return verifyToken(token);
}

export function requireAuth(req: NextRequest): JWTPayload | null {
  return getAuthUser(req);
}
