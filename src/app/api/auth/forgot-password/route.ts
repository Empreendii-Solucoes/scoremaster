import { NextRequest, NextResponse } from 'next/server';
import { loadUsers, updateUser } from '@/lib/data';
import { sendPasswordResetEmail, generateTempPassword } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`forgot:${ip}`, 3, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Informe seu email.' }, { status: 400 });
  }

  const allUsers = await loadUsers();
  const user = allUsers.find((u: any) => 
    u.email && u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return NextResponse.json({
      success: true,
      message: 'Se existir uma conta com este email, uma nova senha será enviada.',
    });
  }

  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  await updateUser(user.username, { 
    password: hashedPassword,
    password_reset_required: true 
  });

  if (user.email) {
    const emailResult = await sendPasswordResetEmail(user.email, user.name, tempPassword);
    if (!emailResult.success) {
      console.error('[FORGOT] Email send failed:', emailResult.error);
      return NextResponse.json({
        error: 'Erro ao enviar email. Tente novamente ou entre em contato com o suporte.',
      }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Se existir uma conta com este email, uma nova senha será enviada.',
  });
}