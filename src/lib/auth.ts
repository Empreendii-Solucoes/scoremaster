import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    '[AUTH] FATAL: JWT_SECRET não está configurado em produção! '
    + 'Configure nas env vars do Vercel. App NÃO pode iniciar sem esta variável.'
  );
}

if (!JWT_SECRET) {
  console.warn('[AUTH] JWT_SECRET não configurado — usando chave de desenvolvimento.');
}

const secret = new TextEncoder().encode(
  JWT_SECRET || 'dev-only-scoremaster-secret-key-change-me'
);

export interface TokenPayload {
  username: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export async function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
