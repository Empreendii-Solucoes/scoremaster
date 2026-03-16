import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const OCR_API_KEY = process.env.OCR_API_KEY || 'helloworld';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sm_token')?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 });
    }

    // Converte o arquivo para base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;

    // Chama OCR.space API
    const ocrForm = new FormData();
    ocrForm.append('base64Image', `data:${mimeType};base64,${base64}`);
    ocrForm.append('language', 'por');
    ocrForm.append('isOverlayRequired', 'false');
    ocrForm.append('detectOrientation', 'true');
    ocrForm.append('scale', 'true');
    ocrForm.append('OCREngine', '2');

    const ocrRes = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { 'apikey': OCR_API_KEY },
      body: ocrForm,
    });

    const ocrData = await ocrRes.json();
    const text: string = ocrData?.ParsedResults?.[0]?.ParsedText || '';

    // Extract data using regex (portado do onboarding.py)
    const extracted = extractData(text);

    return NextResponse.json({ text, extracted });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'Erro no processamento OCR.', extracted: {} }, { status: 500 });
  }
}

function extractData(text: string) {
  const extracted: {
    name?: string;
    cpf?: string;
    score?: number;
    birth_date?: string;
    debts?: { creditor: string; amount: number }[];
  } = {};

  // Nome: "Nome: FULANO DE TAL" ou "NOME COMPLETO"
  const nameMatch = text.match(/(?:Nome[:\s]+)([A-ZÀ-Ú\s]{10,})/i);
  if (nameMatch) extracted.name = nameMatch[1].trim();

  // CPF: 000.000.000-00
  const cpfMatch = text.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/);
  if (cpfMatch) extracted.cpf = cpfMatch[0];

  // Score: "Score: 500" ou "Pontuação: 500"
  const scoreMatch = text.match(/(?:score|pontu[aç])[:\s]+(\d+)/i);
  if (scoreMatch) extracted.score = parseInt(scoreMatch[1]);

  // Data de nascimento
  const birthMatch = text.match(/(?:nascimento|data de nasc)[:\s]+(\d{2}\/\d{2}\/\d{4})/i);
  if (birthMatch) extracted.birth_date = birthMatch[1];

  // Dívidas simples
  const debtMatches = text.matchAll(/([A-ZÀ-Ú\s]{3,})\s+R\$\s*([\d.,]+)/g);
  const debts = [];
  for (const m of debtMatches) {
    const creditor = m[1].trim();
    const amount = parseFloat(m[2].replace('.', '').replace(',', '.'));
    if (creditor && !isNaN(amount) && amount > 0 && amount < 1000000) {
      debts.push({ creditor, amount });
    }
  }
  if (debts.length > 0) extracted.debts = debts;

  return extracted;
}
