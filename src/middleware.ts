import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-only-scoremaster-secret-key-change-me'
);

// Rotas que NÃO precisam de autenticação
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/login',
  '/',
];

// Rotas que precisam de admin
const ADMIN_PATHS = [
  '/admin',
  '/api/users', // GET all users
];

async function verifyJWT(token: string): Promise<{ username: string; isAdmin: boolean } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as { username: string; isAdmin: boolean };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir assets estáticos e rotas públicas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    PUBLIC_PATHS.some(p => pathname === p)
  ) {
    return NextResponse.next();
  }

  // Verificar token para rotas de API protegidas
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('sm_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    // Verificar admin para rotas admin
    if (ADMIN_PATHS.some(p => pathname.startsWith(p)) && !payload.isAdmin) {
      // Exceção: /api/users/[username] pode ser acessado pelo próprio usuário
      const userMatch = pathname.match(/^\/api\/users\/([^/]+)/);
      if (!userMatch || userMatch[1] !== payload.username) {
        return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 });
      }
    }

    // Adicionar info do user ao header para os handlers
    const response = NextResponse.next();
    response.headers.set('x-user-username', payload.username);
    response.headers.set('x-user-isAdmin', String(payload.isAdmin));
    return response;
  }

  // Para páginas protegidas (não-API), redirecionar para login se não autenticado
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') ||
      pathname.startsWith('/profile') || pathname.startsWith('/financial') ||
      pathname.startsWith('/services') || pathname.startsWith('/onboarding') ||
      pathname.startsWith('/health-quiz') || pathname.startsWith('/theme-select')) {
    const token = request.cookies.get('sm_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('sm_token');
      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
