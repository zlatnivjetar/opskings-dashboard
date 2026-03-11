import type { FilterState } from '@/types/filters';

export function serializeFilters(filters: FilterState): string {
  return encodeURIComponent(JSON.stringify(filters));
}

export function parseFiltersParam(raw: string | null): FilterState {
  if (!raw) return {};

  try {
    return JSON.parse(raw) as FilterState;
  } catch {
    return {};
  }
}

