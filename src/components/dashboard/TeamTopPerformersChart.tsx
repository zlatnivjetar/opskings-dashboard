'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartTabs } from '@/components/charts/ChartTabs';
import { type TeamPerformanceRow } from '@/lib/queries/team';
import { formatUsername } from '@/lib/format';
import {
  getTopByFastest,
  getTopByRating,
  getTopByResolved,
} from '@/lib/team-performance-ranking';
import {
  formatLeaderboardFastest,
  formatLeaderboardRating,
  formatLeaderboardResolved,
} from '@/lib/team-leaderboard-format';

type LeaderboardMetric = 'rating' | 'resolved' | 'fastest';

const METRIC_OPTIONS: { value: LeaderboardMetric; label: string }[] = [
  { value: 'rating', label: 'Rating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'fastest', label: 'Fastest' },
];

const METRIC_TITLES: Record<LeaderboardMetric, string> = {
  rating: 'Top performers by rating',
  resolved: 'Top performers by resolved tickets',
  fastest: 'Top performers by fastest resolution',
};

export function TeamTopPerformersChart({
  data = [],
  isLoading = false,
}: {
  data?: TeamPerformanceRow[];
  isLoading?: boolean;
}) {
  const [metric, setMetric] = useState<LeaderboardMetric>('rating');

  const leaderboard = useMemo(() => {
    if (metric === 'rating') return getTopByRating(data, 5);
    if (metric === 'resolved') return getTopByResolved(data, 5);
    return getTopByFastest(data, 5);
  }, [data, metric]);

  const maxValue = useMemo(() => {
    if (metric === 'rating') return leaderboard[0]?.avgRating ?? 0;
    if (metric === 'resolved') return leaderboard[0]?.resolved ?? 0;

    const values = leaderboard
      .map((row) => row.avgResolutionHours)
      .filter((value): value is number => value != null);
    if (values.length === 0) return 0;
    return Math.max(...values);
  }, [leaderboard, metric]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{METRIC_TITLES[metric]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{METRIC_TITLES[metric]}</CardTitle>
          <ChartTabs value={metric} onChange={setMetric} options={METRIC_OPTIONS} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leaderboard data available.</p>
        ) : (
          leaderboard.map((member, index) => {
            const metricValue =
              metric === 'rating'
                ? member.avgRating
                : metric === 'resolved'
                  ? member.resolved
                  : member.avgResolutionHours;

            const width =
              metric === 'fastest'
                ? maxValue > 0 && metricValue != null
                  ? (metricValue / maxValue) * 100
                  : 0
                : maxValue > 0 && metricValue != null
                  ? (metricValue / maxValue) * 100
                  : 0;

            const valueLabel =
              metric === 'rating'
                ? metricValue != null
                  ? formatLeaderboardRating(metricValue)
                  : '—'
                : metric === 'resolved'
                  ? formatLeaderboardResolved(member.resolved)
                  : metricValue != null
                    ? formatLeaderboardFastest(metricValue)
                    : '—';

            return (
              <div key={member.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    #{index + 1} {formatUsername(member.username)}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {valueLabel}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
