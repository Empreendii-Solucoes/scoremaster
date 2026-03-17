import { NextRequest, NextResponse } from 'next/server';
import { loadUsers, updateUser } from '@/lib/data';
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

    if (!password) {
      return NextResponse.json({ error: 'Senha é obrigatória.' }, { status: 400 });
    }

    let user;
    let loginField = username;
    
    if (!username) {
      return NextResponse.json({ error: 'Email ou usuário é obrigatório.' }, { status: 400 });
    }

    try {
      const allUsers = await loadUsers();
      user = allUsers.find((u: any) => 
        u.username === username || 
        (u.email && u.email.toLowerCase() === username.toLowerCase())
      );
    } catch (dbError) {
      console.error('[AUTH] Erro de banco ao buscar usuário:', dbError);
      return NextResponse.json(
        { error: 'Erro ao conectar com o banco de dados. Tente novamente.' },
        { status: 503 }
      );
    }

    if (!user) {
      console.log('[AUTH] Usuário não encontrado:', username);
      return NextResponse.json({ error: 'Email/usuário ou senha incorretos.' }, { status: 401 });
    }

    loginField = user.username;

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
      console.log('[AUTH] Senha incorreta para usuário:', username);
      return NextResponse.json({ error: 'Email/usuário ou senha incorretos.' }, { status: 401 });
    }

    const requiresPasswordReset = user.password_reset_required === true;

    const token = await signToken({ username: user.username, isAdmin: !!user.isAdmin });

    // Remove senha antes de enviar
    const { password: _pw, ...safeUser } = user;

    const response = NextResponse.json({ user: safeUser, token, requiresPasswordReset });
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
