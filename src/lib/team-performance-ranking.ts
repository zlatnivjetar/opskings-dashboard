export type TeamPerformanceRankable = {
  id: number;
  username: string;
  resolved: number;
  resolutionRate: number | null;
  avgResolutionHours: number | null;
  avgRating: number | null;
};

function limitRows<T>(rows: T[], limit: number): T[] {
  return rows.slice(0, Math.max(0, limit));
}

function sortByUsernameAndId<T extends TeamPerformanceRankable>(a: T, b: T): number {
  const byUsername = a.username.localeCompare(b.username, 'en', { sensitivity: 'base' });
  if (byUsername !== 0) return byUsername;
  return a.id - b.id;
}

export function getTopByRating<T extends TeamPerformanceRankable>(rows: T[], limit: number): T[] {
  return limitRows(
    rows
      .filter((row) => row.avgRating != null)
      .toSorted((a, b) => {
        if (b.avgRating! !== a.avgRating!) return b.avgRating! - a.avgRating!;
        if (b.resolved !== a.resolved) return b.resolved - a.resolved;
        return sortByUsernameAndId(a, b);
      }),
    limit
  );
}

export function getTopByResolved<T extends TeamPerformanceRankable>(rows: T[], limit: number): T[] {
  return limitRows(
    rows.toSorted((a, b) => {
      if (b.resolved !== a.resolved) return b.resolved - a.resolved;

      const aResolutionRate = a.resolutionRate ?? Number.NEGATIVE_INFINITY;
      const bResolutionRate = b.resolutionRate ?? Number.NEGATIVE_INFINITY;
      if (bResolutionRate !== aResolutionRate) return bResolutionRate - aResolutionRate;

      return sortByUsernameAndId(a, b);
    }),
    limit
  );
}

export function getTopByFastest<T extends TeamPerformanceRankable>(rows: T[], limit: number): T[] {
  return limitRows(
    rows
      .filter((row) => row.avgResolutionHours != null && row.resolved > 0)
      .toSorted((a, b) => {
        if (a.avgResolutionHours! !== b.avgResolutionHours!) {
          return a.avgResolutionHours! - b.avgResolutionHours!;
        }
        if (b.resolved !== a.resolved) return b.resolved - a.resolved;
        return sortByUsernameAndId(a, b);
      }),
    limit
  );
}
