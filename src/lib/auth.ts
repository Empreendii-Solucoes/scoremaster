import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: JWT_SECRET not set! Using fallback. Set JWT_SECRET in Vercel env vars for production security.');
}

const secret = JWT_SECRET || 'dev-only-scoremaster-secret-key-change-me';

export interface TokenPayload {
  username: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch {
    return null;
  }
}
