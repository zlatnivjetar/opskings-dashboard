import { NextRequest, NextResponse } from 'next/server';
import { getResponseTimeAll } from '@/lib/queries/response-time';
import { parseFiltersParam } from '@/lib/api/filter-state';

function toPositiveInt(raw: string | null, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = parseFiltersParam(params.get('filters'));
  const page = toPositiveInt(params.get('page'), 1);
  const pageSize = toPositiveInt(params.get('pageSize'), 20);

  const data = await getResponseTimeAll(filters, page, pageSize);
  return NextResponse.json(data);
}
