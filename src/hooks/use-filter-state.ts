'use client';

import { startTransition, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  buildPathnameWithSearchParams,
  mergeFiltersIntoSearchParams,
  parseFiltersFromSearchParams,
  serializeFiltersToUrlParams,
} from '@/lib/filter-url-state';
import type { FilterState } from '@/types/filters';

export const parseFilters = parseFiltersFromSearchParams;
export const serializeFilters = serializeFiltersToUrlParams;

export type FilterNavigationMode = 'history' | 'route';

export function useFilterState({
  clearKeys = [],
  navigationMode = 'history',
}: {
  clearKeys?: string[];
  navigationMode?: FilterNavigationMode;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Stabilize the parsed object so query keys and effect deps do not churn.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filters = useMemo(() => parseFilters(searchParams), [searchParams.toString()]);

  const updateURL = useCallback(
    (next: FilterState) => {
      const nextSearchParams = mergeFiltersIntoSearchParams(searchParams, next);
      for (const key of clearKeys) {
        nextSearchParams.delete(key);
      }

      const href = buildPathnameWithSearchParams(pathname, nextSearchParams);

      if (navigationMode === 'route') {
        startTransition(() => {
          router.replace(href, { scroll: false });
        });
        return;
      }

      // Native history updates avoid triggering an RSC refetch on client-query pages.
      window.history.replaceState(null, '', href);
    },
    [clearKeys, navigationMode, pathname, router, searchParams],
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
