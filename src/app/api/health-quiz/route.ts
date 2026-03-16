import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { findUser, updateUser } from '@/lib/data';
import { calculateCreditHealth } from '@/lib/scoring';

// POST: Submete questionário de saúde e calcula o score
export async function POST(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { username, answers } = await request.json();

  if (payload.username !== username && !payload.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const user = await findUser(username);
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  const creditHealth = calculateCreditHealth(answers);

  const updated = await updateUser(username, {
    credit_health: {
      ...creditHealth,
      last_calculated: new Date().toISOString(),
      initial_data: answers,
    },
    credit_health_completed: true,
    progress: {
      ...user.progress,
      task_health_questionnaire: { done: true, timestamp: Date.now() },
    },
  });

  if (!updated) return NextResponse.json({ error: 'Erro ao salvar.' }, { status: 500 });
  return NextResponse.json({ success: true, credit_health: creditHealth });
}

// PUT: Marca uma tarefa como concluída (usado pelo upload handler)
export async function PUT(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { username, taskId, done } = await request.json();

  if (payload.username !== username && !payload.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const user = await findUser(username);
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  const updated = await updateUser(username, {
    progress: {
      ...user.progress,
      [taskId]: { done, timestamp: Date.now() },
    },
  });

  if (!updated) return NextResponse.json({ error: 'Erro ao salvar.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

// GET: Retorna os dados de saúde financeira do usuário
export async function GET(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const username = request.nextUrl.searchParams.get('username') || payload.username;

  if (payload.username !== username && !payload.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const user = await findUser(username);
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  return NextResponse.json({ credit_health: user.credit_health });
}
