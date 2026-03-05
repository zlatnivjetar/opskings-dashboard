import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserContext } from '@/lib/auth/get-user-context';
import { SignOutButton } from '@/components/portal/SignOutButton';
import { SidebarNav } from './SidebarNav';

const TEAM_MEMBER_LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/team', label: 'Team Performance' },
  { href: '/dashboard/distribution', label: 'Distribution' },
  { href: '/dashboard/clients', label: 'Client Analysis' },
  { href: '/dashboard/response-time', label: 'Response Time' },
];

const CLIENT_LINKS = [
  { href: '/portal', label: 'My Tickets' },
  { href: '/portal/new', label: 'New Ticket' },
];

export async function Sidebar() {
  const ctx = await getUserContext();
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user.email ?? '';
  const links = ctx.role === 'team_member' ? TEAM_MEMBER_LINKS : CLIENT_LINKS;

  return (
    <aside className="flex flex-col w-64 h-screen bg-card border-r shrink-0 sticky top-0">
      <div className="p-4 border-b">
        <span className="font-semibold text-sm">OpsKings</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav links={links} />
      </div>

      <div className="p-4 border-t space-y-3">
        <p className="text-xs text-muted-foreground truncate">{email}</p>
        <SignOutButton />
      </div>
    </aside>
  );
}
