import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY não configurada.');
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@empreendii.com.br';

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  tempPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[EMAIL] RESEND_API_KEY não está configurada!');
      return { success: false, error: 'Serviço de email não configurado.' };
    }

    console.log(`[EMAIL] Enviando email de reset para: ${to}, from: ${FROM_EMAIL}`);
    
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: `Empreendii Soluções ScoreMaster <${FROM_EMAIL}>`,
      to,
      subject: 'Sua nova senha provisória — ScoreMaster',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0A0A0A; color: #E5E5E5; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #EEBD2B, #D4A824); border-radius: 12px; line-height: 48px; font-size: 24px;">📈</div>
            <h2 style="color: #EEBD2B; margin: 12px 0 4px;">ScoreMaster</h2>
            <p style="color: #888; font-size: 13px; margin: 0;">Empreendii Soluções</p>
          </div>
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Recebemos seu pedido de recuperação de senha. Aqui está sua nova senha provisória:</p>
          <div style="background: #1A1A1A; border: 1px solid #333; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: 800; letter-spacing: 3px; color: #EEBD2B;">${tempPassword}</span>
          </div>
          <p style="font-size: 14px; color: #AAA;">Use esta senha para acessar sua conta. Recomendamos que altere sua senha após o login.</p>
          <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
          <p style="font-size: 12px; color: #666; text-align: center;">Se você não solicitou esta alteração, ignore este email. Sua senha anterior permanecerá ativa até que você faça login com a nova.</p>
        </div>
      `,
    });

    if (error) {
      console.error('[EMAIL] Resend error:', JSON.stringify(error));
      console.error('[EMAIL] Config: FROM_EMAIL=' + FROM_EMAIL + ', API_KEY prefix=' + apiKey.substring(0, 6) + '...');
      return { success: false, error: error.message };
    }

    console.log('[EMAIL] Email enviado com sucesso! ID:', data?.id);
    return { success: true };
  } catch (e) {
    console.error('[EMAIL] Exception:', e);
    return { success: false, error: 'Falha ao enviar email.' };
  }
}

export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
