import { NextRequest, NextResponse } from 'next/server';
import { loadUsers, saveUsers, findUser } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload || (payload.username !== username && !payload.isAdmin)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const user = await findUser(username);
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload || (payload.username !== username && !payload.isAdmin)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const updates = await request.json();
  const users = await loadUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  users[idx] = { ...users[idx], ...updates };
  await saveUsers(users);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safeUser } = users[idx];
  return NextResponse.json(safeUser);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const users = await loadUsers();
  const filtered = users.filter(u => u.username !== username);
  if (filtered.length === users.length) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }
  await saveUsers(filtered);
  return NextResponse.json({ success: true });
}
