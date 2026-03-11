import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { verifyToken } from '@/lib/auth';
import { loadUsers, saveUsers } from '@/lib/data';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const username = formData.get('username') as string;
    const fileType = formData.get('fileType') as string; // 'serasa' | 'doc_rg' | 'doc_cnh' | 'doc_comprovante' | etc.

    if (!file || !username || !fileType) {
      return NextResponse.json({ error: 'Dados insuficientes.' }, { status: 400 });
    }

    // Somente o próprio usuário ou admin pode fazer upload
    if (payload.username !== username && !payload.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${username}_${fileType}_${Date.now()}.${ext}`;

    // Garante que o diretório existe
    const uploadDir = join(process.cwd(), 'uploads', username);
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Salva referência no usuário
    const users = await loadUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
      const uploads = users[idx].uploads || {};
      uploads[fileType] = {
        filename: fileName,
        originalName: file.name,
        path: `uploads/${username}/${fileName}`,
        uploadedAt: new Date().toISOString(),
        size: file.size,
      };
      users[idx] = { ...users[idx], uploads };

      // Atualiza status do Raio-X se for arquivo Serasa
      if (fileType === 'serasa') {
        users[idx].raio_x_status = 'pending_approval';
      }

      await saveUsers(users);
    }

    return NextResponse.json({ success: true, fileName, path: `uploads/${username}/${fileName}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erro ao salvar arquivo.' }, { status: 500 });
  }
}
