'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Clock, Users, Building2, Ticket, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavCategory = { category: string; items: NavItem[] };

const TEAM_MEMBER_CATEGORIES: NavCategory[] = [
  {
    category: 'General',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/response-time', label: 'Response', icon: Clock },
      { href: '/dashboard/team', label: 'Teams', icon: Users },
      { href: '/dashboard/clients', label: 'Clients', icon: Building2 },
    ],
  },
  {
    category: 'Support',
    items: [
      { href: '/dashboard/distribution', label: 'Tickets', icon: Ticket },
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
                  'flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border-l-2',
                  isActive
                    ? 'border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'border-transparent text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
