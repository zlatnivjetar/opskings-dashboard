import { NextRequest, NextResponse } from 'next/server';
import { getResolutionTimeHistogram } from '@/lib/queries/response-time';
import { parseFiltersParam } from '@/lib/api/filter-state';

export async function GET(request: NextRequest) {
  const filters = parseFiltersParam(request.nextUrl.searchParams.get('filters'));
  const data = await getResolutionTimeHistogram(filters);
  return NextResponse.json(data);
}
