'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { buildPathnameWithSearchParams } from '@/lib/filter-url-state';

type SearchParamScalar = string | number | null | undefined;
type SearchParamArray = readonly (string | number)[];
type SearchParamUpdate = SearchParamScalar | SearchParamArray;

export function useRouteSearchParams() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const replaceParams = useCallback(
    (
      updates: Record<string, SearchParamUpdate>,
      options?: {
        clearKeys?: string[];
      },
    ) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      for (const key of options?.clearKeys ?? []) {
        nextParams.delete(key);
      }

      for (const [key, value] of Object.entries(updates)) {
        nextParams.delete(key);

        if (value == null || value === '') {
          continue;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            nextParams.append(key, String(item));
          }
          continue;
        }

        nextParams.set(key, String(value));
      }

      const href = buildPathnameWithSearchParams(pathname, nextParams);
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const buildHref = useCallback(
    (updates: Record<string, SearchParamUpdate>) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        nextParams.delete(key);

        if (value == null || value === '') {
          continue;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            nextParams.append(key, String(item));
          }
          continue;
        }

        nextParams.set(key, String(value));
      }

      return buildPathnameWithSearchParams(pathname, nextParams);
    },
    [pathname, searchParams],
  );

  return { buildHref, isPending, replaceParams, searchParams };
}
