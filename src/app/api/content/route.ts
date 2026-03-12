import { NextRequest, NextResponse } from 'next/server';
import { loadContent, saveContent } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  const content = await loadContent();

  // Cache por 60s — conteúdo muda raramente (só admin edita)
  const response = NextResponse.json(content);
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  return response;
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const content = await request.json();
  await saveContent(content);
  return NextResponse.json({ success: true });
}
