'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/sign-in');
  }

  return (
    <Button variant="ghost" size="sm" className="w-full text-foreground hover:text-foreground" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
