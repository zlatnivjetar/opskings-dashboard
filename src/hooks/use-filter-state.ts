'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import {
  DATE_FILTER_OPERATORS,
  MULTI_FILTER_OPERATORS,
  type FilterState,
  type DateFilter,
  type MultiFilter,
} from '@/types/filters';

// URL param keys
const DF_OP = 'df_op';
const DF_V = 'df_v';
const TM_OP = 'tm_op';
const TM_V = 'tm_v';
const TT_OP = 'tt_op';
const TT_V = 'tt_v';
const PR_OP = 'pr_op';
const PR_V = 'pr_v';

const DATE_OPERATOR_VALUES = new Set(DATE_FILTER_OPERATORS.map((option) => option.value));
const MULTI_OPERATOR_VALUES = new Set(MULTI_FILTER_OPERATORS.map((option) => option.value));

function normalizeDateOperator(operator: string | null): DateFilter['operator'] {
  return operator && DATE_OPERATOR_VALUES.has(operator as DateFilter['operator'])
    ? (operator as DateFilter['operator'])
    : 'exact';
}

function normalizeMultiOperator(operator: string | null): MultiFilter['operator'] {
  return operator && MULTI_OPERATOR_VALUES.has(operator as MultiFilter['operator'])
    ? (operator as MultiFilter['operator'])
    : 'isAnyOf';
}

export function parseFilters(params: URLSearchParams): FilterState {
  const filters: FilterState = {};

  const dateOp = params.get(DF_OP);
  const dateVal = params.get(DF_V);
  if (dateVal) {
    filters.date = {
      operator: normalizeDateOperator(dateOp),
      value: dateVal,
    };
  }

  const tmOp = params.get(TM_OP);
  const tmVal = params.get(TM_V);
  if (tmOp || tmVal) {
    const values = tmVal
      ? tmVal.split(',').map(Number).filter((n) => !isNaN(n))
      : [];
    filters.teamMember = { operator: normalizeMultiOperator(tmOp), values };
  }

  const ttOp = params.get(TT_OP);
  const ttVal = params.get(TT_V);
  if (ttOp || ttVal) {
    const values = ttVal
      ? ttVal.split(',').map(Number).filter((n) => !isNaN(n))
      : [];
    filters.ticketType = { operator: normalizeMultiOperator(ttOp), values };
  }

  const prOp = params.get(PR_OP);
  const prVal = params.get(PR_V);
  if (prOp || prVal) {
    const values = prVal ? prVal.split(',').filter(Boolean) : [];
    filters.priority = { operator: normalizeMultiOperator(prOp), values };
  }

  return filters;
}

export function serializeFilters(filters: FilterState): string {
  const params = new URLSearchParams();

  if (filters.date) {
    params.set(DF_OP, normalizeDateOperator(filters.date.operator));
    params.set(DF_V, filters.date.value);
  }

  if (filters.teamMember) {
    params.set(TM_OP, normalizeMultiOperator(filters.teamMember.operator));
    if (filters.teamMember.values.length > 0)
      params.set(TM_V, filters.teamMember.values.join(','));
  }

  if (filters.ticketType) {
    params.set(TT_OP, normalizeMultiOperator(filters.ticketType.operator));
    if (filters.ticketType.values.length > 0)
      params.set(TT_V, filters.ticketType.values.join(','));
  }

  if (filters.priority) {
    params.set(PR_OP, normalizeMultiOperator(filters.priority.operator));
    if (filters.priority.values.length > 0)
      params.set(PR_V, filters.priority.values.join(','));
  }

  return params.toString();
}

export function useFilterState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Stabilise reference — parseFilters creates a new object every render,
  // which breaks useEffect deps and TanStack Query key comparisons.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => parseFilters(searchParams), [searchParams.toString()]);

  // Use native history API — Next.js intercepts replaceState and updates
  // useSearchParams() without triggering an RSC soft-navigation refetch.
  const updateURL = useCallback(
    (next: FilterState) => {
      const qs = serializeFilters(next);
      window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname],
  );

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      const current = parseFilters(searchParams);
      updateURL({ ...current, [key]: value });
    },
    [searchParams, updateURL],
  );

  const removeFilter = useCallback(
    (key: keyof FilterState) => {
      const current = parseFilters(searchParams);
      const next = { ...current };
      delete next[key];
      updateURL(next);
    },
    [searchParams, updateURL],
  );

  const clearFilters = useCallback(() => {
    updateURL({});
  }, [updateURL]);

  return { filters, setFilter, removeFilter, clearFilters };
}
