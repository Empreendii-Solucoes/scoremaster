import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'scoremaster-secret-key'
);

// Rotas que NÃO precisam de autenticação
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/login',
  '/',
];

// Rotas que precisam de admin
const ADMIN_PATHS = [
  '/admin',
  '/api/users', // GET all users
];

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

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

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
      response.headers.set('x-user-username', payload.username as string);
      response.headers.set('x-user-isAdmin', String(payload.isAdmin));
      return response;
    } catch {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }
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

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('sm_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
