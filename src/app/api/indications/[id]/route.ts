import { NextRequest, NextResponse } from 'next/server';
import { loadState, saveState } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

async function loadIndications() {
  return loadState<{ indications: any[] }>('indications', { indications: [] });
}

async function saveIndications(data: any) {
  await saveState('indications', data);
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload?.isAdmin) {
    return NextResponse.json({ error: 'Apenas admin pode editar.' }, { status: 403 });
  }

  const { id, status, admin_notes } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
  }

  const data = await loadIndications();
  const index = data.indications.findIndex((i: any) => i.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Indicação não encontrada.' }, { status: 404 });
  }

  data.indications[index] = {
    ...data.indications[index],
    status: status || data.indications[index].status,
    admin_notes: admin_notes !== undefined ? admin_notes : data.indications[index].admin_notes,
    updated_at: new Date().toISOString(),
  };

  await saveIndications(data);

  return NextResponse.json({ success: true, indication: data.indications[index] });
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload?.isAdmin) {
    return NextResponse.json({ error: 'Apenas admin pode excluir.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
  }

  const data = await loadIndications();
  data.indications = data.indications.filter((i: any) => i.id !== id);
  await saveIndications(data);

  return NextResponse.json({ success: true });
}