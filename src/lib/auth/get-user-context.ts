import { cache } from 'react';
import { auth } from './index';
import { headers } from 'next/headers';

export type UserContext = {
  userId: string;
  role: 'team_member' | 'client';
  clientId: number | null;
  teamMemberId: number | null;
};

export const getUserContext = cache(async function getUserContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');
  return {
    userId: session.user.id,
    role: session.user.role as 'team_member' | 'client',
    clientId: session.user.clientId as number | null,
    teamMemberId: session.user.teamMemberId as number | null,
  } satisfies UserContext;
});
