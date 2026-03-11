import { NextResponse } from 'next/server';
import { getTeamPerformance } from '@/lib/queries/team';

export async function GET() {
  const data = await getTeamPerformance();
  return NextResponse.json(data);
}
