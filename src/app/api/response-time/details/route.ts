import { NextRequest, NextResponse } from 'next/server';
import { parseFiltersParam } from '@/lib/api/filter-state';
import { getUserContext } from '@/lib/auth/get-user-context';
import { getOverdueByPriority, getResolutionTimeStats } from '@/lib/queries/response-time';

export async function GET(request: NextRequest) {
  const filters = parseFiltersParam(request.nextUrl.searchParams.get('filters'));
  const ctx = await getUserContext();

  const [stats, overdueByPriority] = await Promise.all([
    getResolutionTimeStats(filters, ctx),
    getOverdueByPriority(filters, ctx),
  ]);

  return NextResponse.json({ stats, overdueByPriority });
}
