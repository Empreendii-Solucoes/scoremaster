import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { findUser } from '@/lib/data';
import { getSignedUrl } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; fileType: string }> }
) {
  const { username, fileType } = await params;
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;

  // Somente o próprio usuário ou admin pode ver
  if (!payload || (payload.username !== username && !payload.isAdmin)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const user = await findUser(username);
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  const upload = user.uploads?.[fileType];
  if (!upload) return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });

  // Gera URL assinada temporária (1h) para download seguro
  const signedUrl = await getSignedUrl(upload.path, 3600);
  if (!signedUrl) {
    return NextResponse.json({ error: 'Erro ao gerar link do arquivo.' }, { status: 500 });
  }

  // Redireciona para a URL assinada
  return NextResponse.redirect(signedUrl);
}
