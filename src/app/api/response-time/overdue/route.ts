import { NextRequest, NextResponse } from 'next/server';
import { getOverdueTickets } from '@/lib/queries/response-time';
import { parseFiltersParam } from '@/lib/api/filter-state';

function toPositiveInt(raw: string | null, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function toNonNegativeInt(raw: string | null, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = parseFiltersParam(params.get('filters'));
  const limit = toPositiveInt(params.get('limit'), 20);
  const offset = toNonNegativeInt(params.get('offset'), 0);
  const page = Math.floor(offset / limit) + 1;

  const data = await getOverdueTickets(filters, { page, pageSize: limit });
  return NextResponse.json(data);
}
