import { NextResponse } from 'next/server';
import { loadBadges } from '@/lib/data';

export async function GET() {
  const badges = await loadBadges();

  const response = NextResponse.json(badges);
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  return response;
}
