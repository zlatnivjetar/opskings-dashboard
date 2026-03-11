'use client';

import { useState } from 'react';
import { Crown, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';
import { getSidebarRouteHrefs, SidebarNav } from './SidebarNav';
import { SignOutButton } from '@/components/portal/SignOutButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  email: string;
  role: string;
  initials: string;
};

export function SidebarClient({ name, email, role, initials }: Props) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const router = useRouter();

  const toggle = () =>
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/sign-in');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-screen bg-sidebar border-r border-sidebar-border shrink-0 sticky top-0 overflow-hidden transition-[width] duration-200',
          collapsed ? 'w-14' : 'w-64',
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center border-b border-sidebar-border shrink-0 py-3',
            collapsed ? 'justify-center px-2' : 'px-4 justify-between',
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
                <Crown className="size-4" />
              </div>
              <span className="font-semibold text-sm text-sidebar-foreground">OpsKings</span>
            </div>
          )}
          <button
            onClick={toggle}
            className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <div className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-1.5' : 'px-3')}>
          <SidebarNav role={role} collapsed={collapsed} />
        </div>

        {/* User profile */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold select-none cursor-default">
                    {initials}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{name}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-background border border-border">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{name}</p>
                  <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                    {role === 'team_member' ? 'Support Agent' : 'Client'}
                  </p>
                  <p className="text-caption truncate">{email}</p>
                </div>
              </div>
              <div className="mt-2">
                <SignOutButton />
              </div>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
