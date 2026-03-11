'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Clock, Users, Building2, Ticket, PlusCircle } from 'lucide-react';
import { LayoutGroup, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavCategory = { category: string; items: NavItem[] };

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
  const categories = role === 'team_member' ? TEAM_MEMBER_CATEGORIES : CLIENT_CATEGORIES;

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
                  prefetch={false}
                  className={cn(
                    'relative flex items-center text-sm font-medium transition-colors',
                    collapsed ? 'justify-center py-2 w-full rounded-md' : 'px-3 py-1.5 rounded-r-md',
                    isActive
                      ? 'text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:text-foreground',
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
