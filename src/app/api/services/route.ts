import { NextRequest, NextResponse } from 'next/server';
import { loadServices, saveServices } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  const services = await loadServices();

  const response = NextResponse.json(services);
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  return response;
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const services = await request.json();
  await saveServices(services);
  return NextResponse.json({ success: true });
}
