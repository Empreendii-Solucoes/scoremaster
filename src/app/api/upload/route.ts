import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { findUser, updateUser } from '@/lib/data';
import { uploadFile } from '@/lib/storage';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  // Rate limit: 10 uploads por minuto por usuário
  const rl = rateLimit(`upload:${payload.username}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitos uploads. Aguarde um momento.' }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const username = formData.get('username') as string;
    const fileType = formData.get('fileType') as string;

    if (!file || !username || !fileType) {
      return NextResponse.json({ error: 'Dados insuficientes.' }, { status: 400 });
    }

    // Limite de 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande (máx. 20MB).' }, { status: 400 });
    }

    // Somente o próprio usuário ou admin pode fazer upload
    if (payload.username !== username && !payload.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload para Supabase Storage
    const result = await uploadFile(buffer, username, fileType, file.name);
    if (!result) {
      return NextResponse.json({ error: 'Erro ao salvar arquivo no storage.' }, { status: 500 });
    }

    // Atualiza referência no usuário (atômico, só o usuário afetado)
    const user = await findUser(username);
    if (user) {
      const uploads = user.uploads || {};
      uploads[fileType] = {
        filename: result.path.split('/').pop() || '',
        originalName: file.name,
        path: result.path,
        uploadedAt: new Date().toISOString(),
        size: file.size,
      };

      const updates: Record<string, unknown> = { uploads };

      // Atualiza status do Raio-X se for arquivo Serasa
      if (fileType === 'serasa') {
        updates.raio_x_status = 'pending_approval';
      }

      await updateUser(username, updates);
    }

    return NextResponse.json({ success: true, path: result.path });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erro ao salvar arquivo.' }, { status: 500 });
  }
}
