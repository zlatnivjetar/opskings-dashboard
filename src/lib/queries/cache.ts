import { revalidateTag } from 'next/cache';
import type { UserContext } from '@/lib/auth/get-user-context';
import type { FilterState, MultiFilter } from '@/types/filters';

export const QUERY_CACHE_TTL_SECONDS = 60;

export const QUERY_CACHE_TAGS = {
  dashboardDistributions: 'query:dashboard-distributions',
  responseTimeOverview: 'query:response-time-overview',
  overdueByPriority: 'query:overdue-by-priority',
  ticketAggregates: 'query:ticket-aggregates',
} as const;

export type QueryCacheOptions = {
  bypassCache?: boolean;
};

export function shouldBypassQueryCache(options?: QueryCacheOptions): boolean {
  return options?.bypassCache === true || process.env.DISABLE_QUERY_CACHE === 'true';
}

function serializeMultiFilter(filter?: MultiFilter): string {
  if (!filter || filter.values.length === 0) return 'all';
  const values = [...filter.values].map(String).sort();
  return `${filter.operator}:${values.join(',')}`;
}

export function serializeFilterState(filters: FilterState): string {
  const datePart = filters.date ? `${filters.date.from}..${filters.date.to}` : 'all';
  const teamPart = serializeMultiFilter(filters.teamMember);
  const typePart = serializeMultiFilter(filters.ticketType);
  const priorityPart = serializeMultiFilter(filters.priority);
  return `date=${datePart}|team=${teamPart}|type=${typePart}|priority=${priorityPart}`;
}

export function serializeUserContext(ctx: UserContext): string {
  return `uid=${ctx.userId}|role=${ctx.role}|cid=${ctx.clientId ?? ''}|tmid=${ctx.teamMemberId ?? ''}`;
}

export function buildQueryCacheKey(ctx: UserContext, filters: FilterState): string {
  return `${serializeUserContext(ctx)}|${serializeFilterState(filters)}`;
}

export function invalidateTicketAggregateCaches(): void {
  revalidateTag(QUERY_CACHE_TAGS.ticketAggregates);
  revalidateTag(QUERY_CACHE_TAGS.dashboardDistributions);
  revalidateTag(QUERY_CACHE_TAGS.responseTimeOverview);
  revalidateTag(QUERY_CACHE_TAGS.overdueByPriority);
}
