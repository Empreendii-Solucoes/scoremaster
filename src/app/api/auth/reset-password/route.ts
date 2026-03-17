import { NextRequest, NextResponse } from 'next/server';
import { findUser, updateUser } from '@/lib/data';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload?.username) {
    return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
  }

  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ error: 'Nova senha é obrigatória.' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
  }

  const user = await findUser(payload.username);
  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await updateUser(payload.username, { 
    password: hashedPassword,
    password_reset_required: false
  });

  return NextResponse.json({ success: true, message: 'Senha redefinida com sucesso.' });
}