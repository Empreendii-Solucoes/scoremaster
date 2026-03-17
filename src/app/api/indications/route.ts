import { NextRequest, NextResponse } from 'next/server';
import { loadState, saveState } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

interface Indication {
  id: string;
  username: string;
  indicated_name: string;
  indicated_phone: string;
  status: 'pending' | 'contacted' | 'converted' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

interface IndicationsData {
  indications: Indication[];
}

async function loadIndications(): Promise<IndicationsData> {
  return loadState<IndicationsData>('indications', { indications: [] });
}

async function saveIndications(data: IndicationsData): Promise<void> {
  await saveState('indications', data);
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const data = await loadIndications();

  if (payload.isAdmin) {
    return NextResponse.json(data.indications);
  }

  const userIndications = data.indications.filter(i => i.username === payload.username);
  return NextResponse.json(userIndications);
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload?.username) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { indicated_name, indicated_phone } = await request.json();

  if (!indicated_name || !indicated_phone) {
    return NextResponse.json({ error: 'Nome e telefone são obrigatórios.' }, { status: 400 });
  }

  const data = await loadIndications();
  
  const newIndication: Indication = {
    id: `ind_${Date.now()}`,
    username: payload.username,
    indicated_name: indicated_name.trim(),
    indicated_phone: indicated_phone.trim(),
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  data.indications.push(newIndication);
  await saveIndications(data);

  return NextResponse.json({ success: true, indication: newIndication });
}