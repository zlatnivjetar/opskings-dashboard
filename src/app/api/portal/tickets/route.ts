import { NextRequest, NextResponse } from 'next/server';
import { getMyTickets } from '@/lib/queries/portal';
import { parseFiltersParam } from '@/lib/api/filter-state';

export async function GET(request: NextRequest) {
  const pageParam = Number(request.nextUrl.searchParams.get('page') ?? '1');
  const pageSizeParam = Number(request.nextUrl.searchParams.get('pageSize') ?? '20');

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? pageSizeParam : 20;
  const filters = parseFiltersParam(request.nextUrl.searchParams.get('filters'));

  const data = await getMyTickets({ page, pageSize, filters });
  return NextResponse.json(data);
}
