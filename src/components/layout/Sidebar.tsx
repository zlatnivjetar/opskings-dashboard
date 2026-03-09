import { headers } from 'next/headers';
import { Crown } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getUserContext } from '@/lib/auth/get-user-context';
import { SignOutButton } from '@/components/portal/SignOutButton';
import { SidebarNav } from './SidebarNav';
import { ThemeToggle } from './ThemeToggle';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getRoleLabel(role: string): string {
  return role === 'team_member' ? 'Support Agent' : 'Client';
}

export async function Sidebar() {
  const ctx = await getUserContext();
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user.email ?? '';
  const name = session?.user.name ?? email;

  return (
    <aside className="flex flex-col w-64 h-screen bg-sidebar border-r border-sidebar-border shrink-0 sticky top-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
            <Crown className="size-4" />
          </div>
          <span className="font-semibold text-sm text-sidebar-foreground">OpsKings</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <SidebarNav role={ctx.role} />
      </div>

      {/* User profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-start gap-3 p-2 rounded-lg bg-sidebar-accent/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
            {getInitials(name)}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{name}</p>
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
              {getRoleLabel(ctx.role)}
            </p>
            <p className="text-caption truncate">{email}</p>
          </div>
        </div>
        <div className="mt-2">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
