import { NextResponse } from 'next/server';
import { findUser } from '@/lib/data';

export async function GET() {
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasJwt = !!process.env.JWT_SECRET;

  let findResult = 'not tested';
  try {
    const user = await findUser('admin');
    findResult = user ? `found (has password: ${!!user.password})` : 'not found';
  } catch (e: unknown) {
    findResult = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    supaUrl: supaUrl ? supaUrl.substring(0, 30) + '...' : 'MISSING',
    hasAnon,
    hasService,
    hasJwt,
    findResult,
    nodeEnv: process.env.NODE_ENV,
  });
}
