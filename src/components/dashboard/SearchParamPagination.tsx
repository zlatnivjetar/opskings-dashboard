'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRouteSearchParams } from '@/hooks/use-route-search-params';

export function SearchParamPagination({
  countLabel,
  page,
  pageParam,
  totalPages,
}: {
  countLabel: string;
  page: number;
  pageParam: string;
  totalPages: number;
}) {
  const router = useRouter();
  const { buildHref, isPending, replaceParams } = useRouteSearchParams();

  useEffect(() => {
    if (page > 1) {
      router.prefetch(buildHref({ [pageParam]: page - 1 === 1 ? null : page - 1 }));
    }

    if (page < totalPages) {
      router.prefetch(buildHref({ [pageParam]: page + 1 }));
    }
  }, [buildHref, page, pageParam, router, totalPages]);

  if (totalPages <= 1) {
    return <p className="text-sm text-muted-foreground">{countLabel}</p>;
  }

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{countLabel}</span>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            replaceParams({
              [pageParam]: page - 1 <= 1 ? null : page - 1,
            })
          }
          disabled={page <= 1 || isPending}
        >
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
          {isPending ? ' | Loading...' : ''}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            replaceParams({
              [pageParam]: page + 1,
            })
          }
          disabled={page >= totalPages || isPending}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
