import { NextRequest, NextResponse } from 'next/server';
import { getClientAnalysis, type SortableColumn } from '@/lib/queries/clients';

const SORTABLE_COLUMNS: SortableColumn[] = [
  'clientName',
  'planType',
  'totalTickets',
  'openTickets',
  'totalSpent',
  'lastTicketDate',
];

function toPositiveInt(raw: string | null, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sortByRaw = params.get('sortBy') as SortableColumn | null;
  const sortOrderRaw = params.get('sortOrder');

  const data = await getClientAnalysis({
    search: params.get('search') ?? '',
    page: toPositiveInt(params.get('page'), 1),
    pageSize: toPositiveInt(params.get('pageSize'), 20),
    sortBy: sortByRaw && SORTABLE_COLUMNS.includes(sortByRaw) ? sortByRaw : 'totalTickets',
    sortOrder: sortOrderRaw === 'asc' ? 'asc' : 'desc',
  });

  return NextResponse.json(data);
}
