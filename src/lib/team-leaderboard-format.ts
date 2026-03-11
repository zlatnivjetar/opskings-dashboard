export function formatLeaderboardRating(value: number): string {
  return value.toFixed(2);
}

export function formatLeaderboardResolved(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatLeaderboardFastest(value: number): string {
  return `${value.toFixed(1)} hrs`;
}
