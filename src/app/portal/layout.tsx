import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserContext } from '@/lib/auth/get-user-context';
import { SignOutButton } from '@/components/portal/SignOutButton';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getUserContext();

  if (ctx.role === 'team_member') {
    redirect('/dashboard');
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user.email ?? '';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-sm">OpsKings Portal</span>
            <nav className="flex items-center gap-4">
              <Link
                href="/portal"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Tickets
              </Link>
              <Link
                href="/portal/new"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                New Ticket
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
