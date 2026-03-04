'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { FilterState, DateFilter, MultiFilter } from '@/types/filters';

// URL param keys
const DF_OP = 'df_op';
const DF_V = 'df_v';
const DF_VT = 'df_vt';
const TM_OP = 'tm_op';
const TM_V = 'tm_v';
const TT_OP = 'tt_op';
const TT_V = 'tt_v';
const PR_OP = 'pr_op';
const PR_V = 'pr_v';

function parseFilters(params: URLSearchParams): FilterState {
  const filters: FilterState = {};

  const dateOp = params.get(DF_OP);
  const dateVal = params.get(DF_V);
  if (dateOp && dateVal) {
    const filter: DateFilter = {
      operator: dateOp as DateFilter['operator'],
      value: dateVal,
    };
    const valTo = params.get(DF_VT);
    if (valTo) filter.valueTo = valTo;
    filters.date = filter;
  }

  const tmOp = params.get(TM_OP);
  if (tmOp) {
    const tmVal = params.get(TM_V);
    const values = tmVal
      ? tmVal.split(',').map(Number).filter((n) => !isNaN(n))
      : [];
    filters.teamMember = { operator: tmOp as MultiFilter['operator'], values };
  }

  const ttOp = params.get(TT_OP);
  if (ttOp) {
    const ttVal = params.get(TT_V);
    const values = ttVal
      ? ttVal.split(',').map(Number).filter((n) => !isNaN(n))
      : [];
    filters.ticketType = { operator: ttOp as MultiFilter['operator'], values };
  }

  const prOp = params.get(PR_OP);
  if (prOp) {
    const prVal = params.get(PR_V);
    const values = prVal ? prVal.split(',').filter(Boolean) : [];
    filters.priority = { operator: prOp as MultiFilter['operator'], values };
  }

  return filters;
}

function serializeFilters(filters: FilterState): string {
  const params = new URLSearchParams();

  if (filters.date) {
    params.set(DF_OP, filters.date.operator);
    params.set(DF_V, filters.date.value);
    if (filters.date.valueTo) params.set(DF_VT, filters.date.valueTo);
  }

  if (filters.teamMember) {
    params.set(TM_OP, filters.teamMember.operator);
    if (filters.teamMember.values.length > 0)
      params.set(TM_V, filters.teamMember.values.join(','));
  }

  if (filters.ticketType) {
    params.set(TT_OP, filters.ticketType.operator);
    if (filters.ticketType.values.length > 0)
      params.set(TT_V, filters.ticketType.values.join(','));
  }

  if (filters.priority) {
    params.set(PR_OP, filters.priority.operator);
    if (filters.priority.values.length > 0)
      params.set(PR_V, filters.priority.values.join(','));
  }

  return params.toString();
}

export function useFilterState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = parseFilters(searchParams);

  const updateURL = useCallback(
    (next: FilterState) => {
      const qs = serializeFilters(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, pathname, searchParams],
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
