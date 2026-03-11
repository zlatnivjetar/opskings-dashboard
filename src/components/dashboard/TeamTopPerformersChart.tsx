'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type TeamPerformanceRow } from '@/lib/queries/team';
import { formatUsername } from '@/lib/format';

type LeaderboardRow = TeamPerformanceRow & { score: number };

function buildLeaderboard(rows: TeamPerformanceRow[]): LeaderboardRow[] {
  return rows
    .map((row) => ({
      ...row,
      score: row.resolved + (row.resolutionRate ?? 0) * 2 + (row.avgRating ?? 0) * 20,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function TeamTopPerformersChart() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['team', 'performance'],
    queryFn: async () => {
      const res = await fetch('/api/team/performance');
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json() as Promise<TeamPerformanceRow[]>;
    },
    staleTime: 30_000,
  });

  const leaderboard = useMemo(() => buildLeaderboard(data), [data]);
  const maxScore = leaderboard[0]?.score ?? 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performers Leaderboard</CardTitle>
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
        <CardTitle>Top Performers Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leaderboard data available.</p>
        ) : (
          leaderboard.map((member, index) => {
            const width = maxScore > 0 ? (member.score / maxScore) * 100 : 0;
            return (
              <div key={member.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    #{index + 1} {formatUsername(member.username)}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {member.score.toFixed(1)}
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
