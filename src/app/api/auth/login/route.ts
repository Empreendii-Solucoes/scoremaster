import { NextRequest, NextResponse } from 'next/server';
import { findUser, updateUser } from '@/lib/data';
import { signToken } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 tentativas por minuto por IP
    const ip = getClientIp(request);
    const rl = rateLimit(`login:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns segundos.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    let user;
    try {
      user = await findUser(username);
    } catch (dbError) {
      console.error('[AUTH] Erro de banco ao buscar usuário:', dbError);
      return NextResponse.json(
        { error: 'Erro ao conectar com o banco de dados. Tente novamente.' },
        { status: 503 }
      );
    }

    if (!user) {
      const hasSupaUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasSupaAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      console.log('[AUTH] Usuário não encontrado:', username, { hasSupaUrl, hasSupaAnon, hasServiceKey });
      return NextResponse.json({ 
        error: 'Usuário ou senha incorretos.',
        _debug: { hasSupaUrl, hasSupaAnon, hasServiceKey, searchedFor: username }
      }, { status: 401 });
    }

    // Migração transparente: senhas antigas estão em texto puro
    // Senhas com hash bcrypt começam com "$2a$" ou "$2b$"
    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');

    let passwordValid = false;
    if (isHashed) {
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Senha legada em texto puro — compara e migra para hash
      passwordValid = user.password === password;
      if (passwordValid) {
        const hashedPassword = await bcrypt.hash(password, 12);
        await updateUser(username, { password: hashedPassword });
      }
    }

    if (!passwordValid) {
      console.log('[AUTH] Senha incorreta para usuário:', username, { isHashed });
      return NextResponse.json({ 
        error: 'Usuário ou senha incorretos.',
        _debug: { stage: 'password', isHashed, userFound: true }
      }, { status: 401 });
    }

    const token = await signToken({ username: user.username, isAdmin: !!user.isAdmin });

    // Remove senha antes de enviar
    const { password: _pw, ...safeUser } = user;

    const response = NextResponse.json({ user: safeUser, token });
    response.cookies.set('sm_token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[AUTH] Erro interno no POST /api/auth/login:', message);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
