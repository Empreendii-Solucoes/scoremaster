import { NextRequest, NextResponse } from 'next/server';
import { findUser, updateUser } from '@/lib/data';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/reset-password
 * Apenas admins podem redefinir a senha de um usuário.
 * Body: { username: string, newPassword: string }
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload?.isAdmin) {
    return NextResponse.json({ error: 'Apenas administradores podem redefinir senhas.' }, { status: 403 });
  }

  const { username, newPassword } = await request.json();

  if (!username || !newPassword) {
    return NextResponse.json({ error: 'Usuário e nova senha são obrigatórios.' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
  }

  const user = await findUser(username);
  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await updateUser(username, { password: hashedPassword });

  return NextResponse.json({ success: true, message: `Senha de ${username} redefinida com sucesso.` });
}
