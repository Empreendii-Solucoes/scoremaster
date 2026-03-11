import { NextRequest, NextResponse } from 'next/server';
import { loadUsers } from '@/lib/data';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    const users = await loadUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 });
    }

    const token = signToken({ username: user.username, isAdmin: !!user.isAdmin });

    // Remove senha antes de enviar
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...safeUser } = user;

    const response = NextResponse.json({ user: safeUser, token });
    response.cookies.set('sm_token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
