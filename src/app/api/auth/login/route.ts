import { NextRequest, NextResponse } from 'next/server';
import { findUser, updateUser } from '@/lib/data';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    const user = await findUser(username);

    if (!user) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 });
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
      return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 });
    }

    const token = signToken({ username: user.username, isAdmin: !!user.isAdmin });

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
