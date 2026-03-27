import {
  getSearchParamValue,
  type PageSearchParams,
  type SearchParamsLike,
} from '@/lib/filter-url-state';
import {
  MULTI_FILTER_OPERATORS,
  type FilterOperator,
  type MultiFilter,
} from '@/types/filters';
import type { SortableColumn } from '@/lib/queries/clients';

const MULTI_OPERATOR_VALUES = new Set(MULTI_FILTER_OPERATORS.map((option) => option.value));

export const RESPONSE_TIME_OVERDUE_PAGE_PARAM = 'rt_page';
export const TEAM_TABLE_PAGE_PARAM = 'team_page';
export const CLIENTS_TABLE_PAGE_PARAM = 'clients_page';

export const RESPONSE_TIME_PAGE_SIZE = 20;
export const TEAM_TABLE_PAGE_SIZE = 20;
export const CLIENTS_TABLE_PAGE_SIZE = 20;

export type SortOrder = 'asc' | 'desc';

export type TeamTableSort =
  | 'username'
  | 'department'
  | 'status'
  | 'assigned'
  | 'resolved'
  | 'avgResolutionHours'
  | 'avgRating';

export type TeamTableState = {
  query: string;
  department: string;
  status: string;
  sortBy: TeamTableSort;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
};

export type ClientTableState = {
  query: string;
  plan: MultiFilter | undefined;
  ticketsMin: number | null;
  ticketsMax: number | null;
  openMin: number | null;
  openMax: number | null;
  spentMin: number | null;
  spentMax: number | null;
  sortBy: SortableColumn;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
};

type SupportedSearchParams = SearchParamsLike | PageSearchParams | undefined;

const TEAM_SORT_KEYS: readonly TeamTableSort[] = [
  'username',
  'department',
  'status',
  'assigned',
  'resolved',
  'avgResolutionHours',
  'avgRating',
] as const;

const CLIENT_SORT_KEYS: readonly SortableColumn[] = [
  'clientName',
  'planType',
  'totalTickets',
  'openTickets',
  'totalSpent',
  'lastTicketDate',
] as const;

function normalizeSortOrder(value: string | null, fallback: SortOrder): SortOrder {
  if (value === 'asc' || value === 'desc') {
    return value;
  }

  return fallback;
}

function normalizeMultiOperator(value: string | null): FilterOperator {
  return value && MULTI_OPERATOR_VALUES.has(value as FilterOperator)
    ? (value as FilterOperator)
    : 'isAnyOf';
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNullableNumber(value: string | null): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStringList(value: string | null): string[] {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

export function parsePageParam(
  searchParams: SupportedSearchParams,
  key: string,
  fallback = 1,
): number {
  return parsePositiveInt(searchParams ? getSearchParamValue(searchParams, key) : null, fallback);
}

export function parseTeamTableState(searchParams: SupportedSearchParams): TeamTableState {
  const sortByRaw = searchParams ? getSearchParamValue(searchParams, 'team_sort') : null;

  return {
    query: searchParams ? getSearchParamValue(searchParams, 'team_q') ?? '' : '',
    department: searchParams ? getSearchParamValue(searchParams, 'team_department') ?? '' : '',
    status: searchParams ? getSearchParamValue(searchParams, 'team_status') ?? '' : '',
    sortBy:
      sortByRaw && TEAM_SORT_KEYS.includes(sortByRaw as TeamTableSort)
        ? (sortByRaw as TeamTableSort)
        : 'username',
    sortOrder: normalizeSortOrder(
      searchParams ? getSearchParamValue(searchParams, 'team_dir') : null,
      'asc',
    ),
    page: parsePageParam(searchParams, TEAM_TABLE_PAGE_PARAM, 1),
    pageSize: TEAM_TABLE_PAGE_SIZE,
  };
}

export function parseClientTableState(searchParams: SupportedSearchParams): ClientTableState {
  const sortByRaw = searchParams ? getSearchParamValue(searchParams, 'clients_sort') : null;
  const planValues = searchParams
    ? parseStringList(getSearchParamValue(searchParams, 'clients_plan_v'))
    : [];

  return {
    query: searchParams ? getSearchParamValue(searchParams, 'clients_q') ?? '' : '',
    plan:
      planValues.length > 0
        ? {
            operator: normalizeMultiOperator(
              searchParams ? getSearchParamValue(searchParams, 'clients_plan_op') : null,
            ),
            values: planValues,
          }
        : undefined,
    ticketsMin: parseNullableNumber(
      searchParams ? getSearchParamValue(searchParams, 'clients_tickets_min') : null,
    ),
    ticketsMax: parseNullableNumber(
      searchParams ? getSearchParamValue(searchParams, 'clients_tickets_max') : null,
    ),
    openMin: parseNullableNumber(
      searchParams ? getSearchParamValue(searchParams, 'clients_open_min') : null,
    ),
    openMax: parseNullableNumber(
      searchParams ? getSearchParamValue(searchParams, 'clients_open_max') : null,
    ),
    spentMin: parseNullableNumber(
      searchParams ? getSearchParamValue(searchParams, 'clients_spent_min') : null,
    ),
    spentMax: parseNullableNumber(
      searchParams ? getSearchParamValue(searchParams, 'clients_spent_max') : null,
    ),
    sortBy:
      sortByRaw && CLIENT_SORT_KEYS.includes(sortByRaw as SortableColumn)
        ? (sortByRaw as SortableColumn)
        : 'totalTickets',
    sortOrder: normalizeSortOrder(
      searchParams ? getSearchParamValue(searchParams, 'clients_dir') : null,
      'desc',
    ),
    page: parsePageParam(searchParams, CLIENTS_TABLE_PAGE_PARAM, 1),
    pageSize: CLIENTS_TABLE_PAGE_SIZE,
  };
}
