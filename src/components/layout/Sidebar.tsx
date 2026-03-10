import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserContext } from '@/lib/auth/get-user-context';
import { SidebarClient } from './SidebarClient';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export async function Sidebar() {
  const ctx = await getUserContext();
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user.email ?? '';
  const name = session?.user.name ?? email;

  return (
    <SidebarClient
      name={name}
      email={email}
      role={ctx.role}
      initials={getInitials(name)}
    />
  );
}
