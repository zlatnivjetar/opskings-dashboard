'use server';

import { asc, eq } from 'drizzle-orm';
import { adminDb } from '@/lib/db';
import { teamMembers, ticketTypes } from '@/lib/db/schema';

export async function getTeamMembers() {
  return adminDb
    .select({ id: teamMembers.id, username: teamMembers.username })
    .from(teamMembers)
    .where(eq(teamMembers.status, 'active'))
    .orderBy(asc(teamMembers.username));
}

export async function getTicketTypes() {
  return adminDb
    .select({ id: ticketTypes.id, typeName: ticketTypes.typeName })
    .from(ticketTypes)
    .orderBy(asc(ticketTypes.typeName));
}

/** Combined call — avoids Next.js server-action serialization for FilterBar. */
export async function getReferenceData() {
  const [members, types] = await Promise.all([getTeamMembers(), getTicketTypes()]);
  return { teamMembers: members, ticketTypes: types };
}

