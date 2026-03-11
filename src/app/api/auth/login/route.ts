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
    
    if (users.length === 0) {
      console.error('[AUTH] Nenhum usuário encontrado no Supabase. Verifique as credenciais no .env.local ou dashboard Vercel.');
      // No Vercel, se o login falhar pois as env vars estão erradas, loadUsers retorna [].
      // Vamos retornar um erro mais específico para ajudar o usuário.
      return NextResponse.json({ 
        error: 'Erro de conexão com o banco de dados. Configure as Variáveis de Ambiente no Vercel.',
        debug: 'Users list is empty'
      }, { status: 500 });
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
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
    });

    return response;
  } catch (e: any) {
    console.error('[AUTH] Erro interno no POST /api/auth/login:', e.message);
    return NextResponse.json({ error: 'Erro interno do servidor.', detail: e.message }, { status: 500 });
  }
}
