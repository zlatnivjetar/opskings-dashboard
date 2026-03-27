import { Suspense } from 'react';
import { FilterBar } from '@/components/filters/FilterBar';
import type { FilterNavigationMode } from '@/hooks/use-filter-state';
import type { FilterState } from '@/types/filters';

type FilterKey = keyof FilterState;

export function PageHeader({
  title,
  allowedFilters,
  clearKeysOnChange,
  navigationMode,
}: {
  title: string;
  allowedFilters?: FilterKey[];
  clearKeysOnChange?: string[];
  navigationMode?: FilterNavigationMode;
}) {
  return (
    <div>
      <h1 className="mb-4 text-page-title">{title}</h1>
      <Suspense>
        <FilterBar
          allowedFilters={allowedFilters}
          clearKeysOnChange={clearKeysOnChange}
          navigationMode={navigationMode}
        />
      </Suspense>
    </div>
  );
}
