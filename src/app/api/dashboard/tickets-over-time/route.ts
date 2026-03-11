import { NextRequest, NextResponse } from 'next/server';
import { getTicketsOverTime } from '@/lib/queries/dashboard';
import { parseFiltersParam } from '@/lib/api/filter-state';

export async function GET(request: NextRequest) {
  const filters = parseFiltersParam(request.nextUrl.searchParams.get('filters'));
  const data = await getTicketsOverTime(filters);
  return NextResponse.json(data);
}
