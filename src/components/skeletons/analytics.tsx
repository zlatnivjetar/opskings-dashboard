import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ChartCardSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full rounded-lg" style={{ height }} />
      </CardContent>
    </Card>
  );
}

export function DashboardDistributionsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChartCardSkeleton height={300} />
      <div className="lg:col-span-2">
        <ChartCardSkeleton height={220} />
      </div>
    </div>
  );
}

export function ResponseTimeDetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ChartCardSkeleton height={280} />
      </div>
      <ChartCardSkeleton height={280} />
    </div>
  );
}

export function TableCardSkeleton({
  rows = 8,
  titleWidth = '10rem',
}: {
  rows?: number;
  titleWidth?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6" style={{ width: titleWidth }} />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full rounded-md" />
        ))}
      </CardContent>
    </Card>
  );
}

export function CompactSummarySkeleton({
  items = 3,
}: {
  items?: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: items }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}
