import type { FilterState, MultiFilter } from '@/types/filters';
import { MULTI_FILTER_OPERATORS } from '@/types/filters';

const DF_FROM = 'df_from';
const DF_TO = 'df_to';
const DF_V = 'df_v';
const TM_OP = 'tm_op';
const TM_V = 'tm_v';
const TT_OP = 'tt_op';
const TT_V = 'tt_v';
const PR_OP = 'pr_op';
const PR_V = 'pr_v';

const MULTI_OPERATOR_VALUES = new Set(MULTI_FILTER_OPERATORS.map((option) => option.value));

type SearchParamValue = string | string[] | undefined;
type SearchParamRecord = Record<string, SearchParamValue>;
export type SearchParamsLike = Pick<URLSearchParams, 'get' | 'toString'> | SearchParamRecord;

export type PageSearchParams = SearchParamRecord;

const FILTER_PARAM_KEYS = [DF_FROM, DF_TO, DF_V, TM_OP, TM_V, TT_OP, TT_V, PR_OP, PR_V] as const;

function normalizeMultiOperator(operator: string | null): MultiFilter['operator'] {
  return operator && MULTI_OPERATOR_VALUES.has(operator as MultiFilter['operator'])
    ? (operator as MultiFilter['operator'])
    : 'isAnyOf';
}

function isUrlSearchParams(value: SearchParamsLike): value is Pick<URLSearchParams, 'get' | 'toString'> {
  return typeof (value as Pick<URLSearchParams, 'get'>).get === 'function';
}

export function getSearchParamValue(params: SearchParamsLike, key: string): string | null {
  if (isUrlSearchParams(params)) {
    return params.get(key);
  }

  const rawValue = params[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

export function parseFiltersFromSearchParams(params: SearchParamsLike): FilterState {
  const filters: FilterState = {};

  const dateFrom = getSearchParamValue(params, DF_FROM);
  const dateTo = getSearchParamValue(params, DF_TO);

  if (dateFrom && dateTo) {
    filters.date = { from: dateFrom, to: dateTo };
  } else {
    const legacyDateVal = getSearchParamValue(params, DF_V);
    if (legacyDateVal) {
      filters.date = { from: legacyDateVal, to: legacyDateVal };
    }
  }

  const teamMemberOperator = getSearchParamValue(params, TM_OP);
  const teamMemberValues = getSearchParamValue(params, TM_V);
  if (teamMemberOperator || teamMemberValues) {
    const values = teamMemberValues
      ? teamMemberValues.split(',').map(Number).filter((value) => !Number.isNaN(value))
      : [];
    filters.teamMember = {
      operator: normalizeMultiOperator(teamMemberOperator),
      values,
    };
  }

  const ticketTypeOperator = getSearchParamValue(params, TT_OP);
  const ticketTypeValues = getSearchParamValue(params, TT_V);
  if (ticketTypeOperator || ticketTypeValues) {
    const values = ticketTypeValues
      ? ticketTypeValues.split(',').map(Number).filter((value) => !Number.isNaN(value))
      : [];
    filters.ticketType = {
      operator: normalizeMultiOperator(ticketTypeOperator),
      values,
    };
  }

  const priorityOperator = getSearchParamValue(params, PR_OP);
  const priorityValues = getSearchParamValue(params, PR_V);
  if (priorityOperator || priorityValues) {
    filters.priority = {
      operator: normalizeMultiOperator(priorityOperator),
      values: priorityValues ? priorityValues.split(',').filter(Boolean) : [],
    };
  }

  return filters;
}

function setFilterParams(params: URLSearchParams, filters: FilterState): void {
  for (const key of FILTER_PARAM_KEYS) {
    params.delete(key);
  }

  if (filters.date) {
    params.set(DF_FROM, filters.date.from);
    params.set(DF_TO, filters.date.to);
  }

  if (filters.teamMember) {
    params.set(TM_OP, normalizeMultiOperator(filters.teamMember.operator));
    if (filters.teamMember.values.length > 0) {
      params.set(TM_V, filters.teamMember.values.join(','));
    }
  }

  if (filters.ticketType) {
    params.set(TT_OP, normalizeMultiOperator(filters.ticketType.operator));
    if (filters.ticketType.values.length > 0) {
      params.set(TT_V, filters.ticketType.values.join(','));
    }
  }

  if (filters.priority) {
    params.set(PR_OP, normalizeMultiOperator(filters.priority.operator));
    if (filters.priority.values.length > 0) {
      params.set(PR_V, filters.priority.values.join(','));
    }
  }
}

function toMutableSearchParams(
  baseParams: SearchParamsLike | URLSearchParams | string | undefined,
): URLSearchParams {
  if (!baseParams) {
    return new URLSearchParams();
  }

  if (typeof baseParams === 'string') {
    return new URLSearchParams(baseParams);
  }

  if (baseParams instanceof URLSearchParams) {
    return new URLSearchParams(baseParams.toString());
  }

  if (isUrlSearchParams(baseParams)) {
    return new URLSearchParams(baseParams.toString());
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(baseParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    if (value != null) {
      params.set(key, value);
    }
  }

  return params;
}

export function mergeFiltersIntoSearchParams(
  baseParams: SearchParamsLike | URLSearchParams | string | undefined,
  filters: FilterState,
): URLSearchParams {
  const params = toMutableSearchParams(baseParams);

  setFilterParams(params, filters);
  return params;
}

export function buildPathnameWithSearchParams(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function serializeFiltersToUrlParams(filters: FilterState): string {
  const params = mergeFiltersIntoSearchParams(undefined, filters);

  return params.toString();
}

export async function getFiltersFromPageSearchParams(
  searchParams?: Promise<PageSearchParams> | PageSearchParams,
): Promise<FilterState> {
  if (!searchParams) {
    return {};
  }

  return parseFiltersFromSearchParams(await searchParams);
}
