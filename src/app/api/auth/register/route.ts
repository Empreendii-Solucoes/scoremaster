import { NextRequest, NextResponse } from 'next/server';
import { loadUsers, saveUsers } from '@/lib/data';
import { signToken } from '@/lib/auth';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { username, password, name, phone, profile_choice, cpf, cnpj } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 });
    }

    const users = await loadUsers();

    // Verificar se usuário já existe
    const existing = users.find(u => u.username === username);
    if (existing) {
      return NextResponse.json({ error: 'Nome de usuário já está em uso.' }, { status: 409 });
    }

    const profiles: User['profiles'] = {};

    if (profile_choice === 'PF' || profile_choice === 'Ambos') {
      profiles.PF = {
        name,
        identifier: cpf || '',
        cpf: cpf || '',
        score: 0,
        scoreTrend: 'stable',
        debts: [],
      };
    }

    if (profile_choice === 'PJ' || profile_choice === 'Ambos') {
      profiles.PJ = {
        company_name: name,
        identifier: cnpj || '',
        cnpj: cnpj || '',
        score: 0,
        scoreTrend: 'stable',
        debts: [],
      };
    }

    const newUser: User = {
      username,
      password,
      name,
      email: '',
      phone: phone || '',
      onboarding_completed: false,
      credit_health_completed: false,
      raio_x_status: 'pending',
      pending_xray_purchase: false,
      profiles,
      financial_items: [],
      badges: [],
      progress: {},
      credit_health: {
        score: 300,
        level: 'Iniciante',
        level_color: '#FF5252',
        percentage: 30,
        last_calculated: null,
        initial_data: {},
      },
      total_points: 0,
      streak_days: 0,
      last_activity: null,
    };

    users.push(newUser);
    await saveUsers(users);

    const token = signToken({ username: newUser.username, isAdmin: false });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...safeUser } = newUser;

    const response = NextResponse.json({ user: safeUser, token }, { status: 201 });
    response.cookies.set('sm_token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
