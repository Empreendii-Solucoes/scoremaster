import { NextRequest, NextResponse } from 'next/server';
import { findUser, updateUser } from '@/lib/data';
import { sendPasswordResetEmail, generateTempPassword } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/forgot-password
 * Público — gera senha provisória e envia por email.
 * Body: { username: string }
 */
export async function POST(request: NextRequest) {
  // Rate limit: 3 tentativas por minuto por IP
  const ip = getClientIp(request);
  const rl = rateLimit(`forgot:${ip}`, 3, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const { username } = await request.json();

  if (!username) {
    return NextResponse.json({ error: 'Informe seu nome de usuário.' }, { status: 400 });
  }

  const user = await findUser(username);

  // Resposta genérica para não revelar se o usuário existe
  if (!user || !user.email) {
    return NextResponse.json({
      success: true,
      message: 'Se o usuário existir e tiver um email cadastrado, uma nova senha será enviada.',
    });
  }

  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  await updateUser(username, { password: hashedPassword });

  const emailResult = await sendPasswordResetEmail(user.email, user.name, tempPassword);

  if (!emailResult.success) {
    console.error('[FORGOT] Email send failed:', emailResult.error);
    return NextResponse.json({
      error: 'Erro ao enviar email. Tente novamente ou entre em contato com o suporte.',
    }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Se o usuário existir e tiver um email cadastrado, uma nova senha será enviada.',
  });
}
