'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type NavLink = { href: string; label: string };

export function SidebarNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname === href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
