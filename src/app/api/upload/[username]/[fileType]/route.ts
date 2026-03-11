import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { verifyToken } from '@/lib/auth';
import { findUser } from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; fileType: string }> }
) {
  const { username, fileType } = await params;
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? verifyToken(token) : null;

  // Somente o próprio usuário ou admin pode ver
  if (!payload || (payload.username !== username && !payload.isAdmin)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const user = await findUser(username);
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  const upload = user.uploads?.[fileType];
  if (!upload) return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });

  try {
    const filePath = join(process.cwd(), upload.path);
    const buffer = await readFile(filePath);
    const ext = upload.filename.split('.').pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg', jpeg: 'image/jpeg',
      png: 'image/png', webp: 'image/webp',
    };
    const contentType = mimeMap[ext || ''] || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${upload.originalName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao ler arquivo.' }, { status: 500 });
  }
}
