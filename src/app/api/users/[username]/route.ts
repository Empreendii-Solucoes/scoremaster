import { NextRequest, NextResponse } from 'next/server';
import { findUser, updateUser, deleteUser } from '@/lib/data';
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

  // Impedir que não-admins alterem campos sensíveis
  if (!payload.isAdmin) {
    delete updates.isAdmin;
    delete updates.password;
  }

  const updated = await updateUser(username, updates);
  if (!updated) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  const { password: _pw, ...safeUser } = updated;
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

  const success = await deleteUser(username);
  if (!success) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
