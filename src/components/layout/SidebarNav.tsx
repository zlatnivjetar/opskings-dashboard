'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Clock, Users, Building2, Ticket, PlusCircle } from 'lucide-react';
import { LayoutGroup, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

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

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  const categories = role === 'team_member' ? TEAM_MEMBER_CATEGORIES : CLIENT_CATEGORIES;

  return (
    <LayoutGroup id="sidebar-nav">
      <nav className="flex flex-col gap-0.5">
        {categories.map(({ category, items }) => (
          <div key={category} className="mb-1">
            {category && (
              <p className="px-3 mb-1 mt-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground first:mt-0">
                {category}
              </p>
            )}
            {items.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  className={cn(
                    'relative flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:text-sidebar-accent-foreground',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-bg"
                      className="absolute inset-0 rounded-md bg-sidebar-accent"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <Icon className="size-[18px] shrink-0" />
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </LayoutGroup>
  );
}
