import { NextRequest, NextResponse } from 'next/server';
import { loadUsers, saveUsers } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const users = await loadUsers();
  const safeUsers = users.map(({ password: _pw, ...u }) => u);
  return NextResponse.json(safeUsers);
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const body = await request.json();
  const users = await loadUsers();
  users.push(body);
  await saveUsers(users);
  return NextResponse.json({ success: true });
}
