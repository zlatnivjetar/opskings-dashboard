'use server';

import { asc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/db';
import { teamMembers, ticketTypes } from '@/lib/db/schema';

const getCachedTeamMembers = unstable_cache(
  async () => {
    return adminDb
      .select({ id: teamMembers.id, username: teamMembers.username })
      .from(teamMembers)
      .where(eq(teamMembers.status, 'active'))
      .orderBy(asc(teamMembers.username));
  },
  ['reference-team-members'],
  {
    revalidate: 60 * 30,
    tags: ['reference', 'team-members'],
  },
);

const getCachedTicketTypes = unstable_cache(
  async () => {
    return adminDb
      .select({ id: ticketTypes.id, typeName: ticketTypes.typeName })
      .from(ticketTypes)
      .orderBy(asc(ticketTypes.typeName));
  },
  ['reference-ticket-types'],
  {
    revalidate: 60 * 30,
    tags: ['reference', 'ticket-types'],
  },
);

export async function getTeamMembers() {
  return getCachedTeamMembers();
}

export async function getTicketTypes() {
  return getCachedTicketTypes();
}

/** Combined call — avoids Next.js server-action serialization for FilterBar. */
export async function getReferenceData() {
  const [members, types] = await Promise.all([getTeamMembers(), getTicketTypes()]);
  return { teamMembers: members, ticketTypes: types };
}
