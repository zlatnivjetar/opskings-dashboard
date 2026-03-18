'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, Clock, Users, Building2, Ticket, PlusCircle } from 'lucide-react';
import { LayoutGroup, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getReferenceData } from '@/lib/actions/reference';
import type {
  DashboardSummary,
  TicketsByPriorityRow,
  TicketsByTypeRow,
  TicketsOverTimeRow,
} from '@/lib/queries/dashboard';
import type {
  OverdueByPriorityRow,
  ResolutionStatRow,
  ResponseTimeOverview,
} from '@/lib/queries/response-time';
import type { TeamPerformanceRow } from '@/lib/queries/team';
import type { ClientAnalysisResult } from '@/lib/queries/clients';

const PREFETCH_ROUTES = new Set(['/dashboard', '/response-time', '/team', '/clients', '/portal']);

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function shouldPrefetchRoute(href: string) {
  return PREFETCH_ROUTES.has(href);
}

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavCategory = { category: string; items: NavItem[] };
type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
};
type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const TEAM_MEMBER_CATEGORIES: NavCategory[] = [
  {
    category: 'General',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/response-time', label: 'Response', icon: Clock },
      { href: '/team', label: 'Teams', icon: Users },
      { href: '/clients', label: 'Clients', icon: Building2 },
    ],
  },
];

const CLIENT_CATEGORIES: NavCategory[] = [
  {
    category: '',
    items: [
      { href: '/portal', label: 'My Tickets', icon: Ticket },
      { href: '/portal/new', label: 'New Ticket', icon: PlusCircle },
    ],
  },
];

export function getSidebarRouteHrefs(role: string): string[] {
  const categories = role === 'team_member' ? TEAM_MEMBER_CATEGORIES : CLIENT_CATEGORIES;
  return categories.flatMap(({ items }) => items.map(({ href }) => href));
}

export function SidebarNav({ role, collapsed = false }: { role: string; collapsed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const warmedRoutesRef = useRef(new Set<string>());
  const categories = role === 'team_member' ? TEAM_MEMBER_CATEGORIES : CLIENT_CATEGORIES;

  const warmRouteData = useCallback(
    (href: string) => {
      if (!shouldPrefetchRoute(href) || warmedRoutesRef.current.has(href)) {
        return;
      }

      warmedRoutesRef.current.add(href);
      router.prefetch(href);

      const emptyFilterKey = {};

      void queryClient.prefetchQuery({
        queryKey: ['reference', 'all'],
        queryFn: getReferenceData,
        staleTime: 60 * 60 * 1000,
      });

      if (href === '/dashboard') {
        void queryClient.prefetchQuery({
          queryKey: ['dashboard', 'summary', emptyFilterKey],
          queryFn: () =>
            getJson<{ summary: DashboardSummary; previousSummary: DashboardSummary | null }>(
              '/api/dashboard/summary?filters=',
            ),
          staleTime: 30_000,
        });
        void queryClient.prefetchQuery({
          queryKey: ['dashboard', 'tickets-over-time', emptyFilterKey],
          queryFn: () => getJson<TicketsOverTimeRow[]>('/api/dashboard/tickets-over-time?filters='),
          staleTime: 30_000,
        });
        void queryClient.prefetchQuery({
          queryKey: ['dashboard', 'by-type', emptyFilterKey],
          queryFn: () => getJson<TicketsByTypeRow[]>('/api/dashboard/by-type?filters='),
          staleTime: 30_000,
        });
        void queryClient.prefetchQuery({
          queryKey: ['dashboard', 'by-priority', emptyFilterKey],
          queryFn: () => getJson<TicketsByPriorityRow[]>('/api/dashboard/by-priority?filters='),
          staleTime: 30_000,
        });
      }

      if (href === '/response-time') {
        void queryClient.prefetchQuery({
          queryKey: ['response-time', 'overview', emptyFilterKey],
          queryFn: () => getJson<ResponseTimeOverview>('/api/response-time/overview?filters='),
          staleTime: 30_000,
        });
        void queryClient.prefetchQuery({
          queryKey: ['response-time', 'details', emptyFilterKey],
          queryFn: () =>
            getJson<{ stats: ResolutionStatRow[]; overdueByPriority: OverdueByPriorityRow[] }>(
              '/api/response-time/details?filters=',
            ),
          staleTime: 30_000,
        });
      }

      if (href === '/team') {
        void queryClient.prefetchQuery({
          queryKey: ['team', 'performance', emptyFilterKey],
          queryFn: () => getJson<TeamPerformanceRow[]>('/api/team/performance?filters='),
          staleTime: 30_000,
        });
      }

      if (href === '/clients') {
        void queryClient.prefetchQuery({
          queryKey: ['clients', 'analysis', 'all'],
          queryFn: () => getJson<ClientAnalysisResult>('/api/clients/analysis?page=1&pageSize=1000'),
          staleTime: 30_000,
        });
      }

    },
    [queryClient, router],
  );

  useEffect(() => {
    const connection = (navigator as NavigatorWithConnection).connection;
    if (connection?.saveData) {
      return;
    }

    if (connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
      return;
    }

    const prewarm = () => {
      if (role === 'team_member') {
        warmRouteData('/dashboard');
        warmRouteData('/response-time');
        warmRouteData('/team');
        warmRouteData('/clients');
        return;
      }

      warmRouteData('/portal');
    };

    const windowWithIdleCallback = window as WindowWithIdleCallback;
    if (windowWithIdleCallback.requestIdleCallback && windowWithIdleCallback.cancelIdleCallback) {
      const idleId = windowWithIdleCallback.requestIdleCallback(prewarm, { timeout: 1500 });
      return () => windowWithIdleCallback.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(prewarm, 200);
    return () => window.clearTimeout(timeoutId);
  }, [role, warmRouteData]);

  return (
    <LayoutGroup id="sidebar-nav">
      <nav className="flex flex-col gap-0.5">
        {categories.map(({ category, items }) => (
          <div key={category} className="mb-1">
            {!collapsed && category && (
              <p className="px-3 mb-1 mt-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground first:mt-0">
                {category}
              </p>
            )}
            {items.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              const link = (
                <Link
                  href={href}
                  prefetch={shouldPrefetchRoute(href)}
                  onMouseEnter={() => warmRouteData(href)}
                  onFocus={() => warmRouteData(href)}
                  className={cn(
                    'relative flex items-center text-sm font-medium transition-colors',
                    collapsed ? 'justify-center py-2 w-full rounded-md' : 'px-3 py-1.5 rounded-r-md',
                    isActive
                      ? 'text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-bg"
                      className={cn(
                        'absolute inset-0 bg-sidebar-accent',
                        collapsed ? 'rounded-md' : 'rounded-r-md',
                      )}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                    />
                  )}
                  {isActive && !collapsed && (
                    <motion.span
                      layoutId="active-indicator"
                      className="absolute left-0 top-0.5 bottom-0.5 w-[3px] bg-primary rounded-r-full"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                    />
                  )}
                  <span className={cn('relative z-10 flex items-center', !collapsed && 'gap-3')}>
                    <Icon className="size-[18px] shrink-0" />
                    {!collapsed && label}
                  </span>
                </Link>
              );

              return (
                <div key={href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
    </LayoutGroup>
  );
}
