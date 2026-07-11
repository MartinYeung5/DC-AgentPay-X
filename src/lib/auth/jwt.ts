/**
 * JWT session management
 */
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  loginMethod: 'metamask' | 'google';
  metamaskAddress?: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}
