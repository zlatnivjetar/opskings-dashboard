import { and, eq, ne, inArray, notInArray, gte, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { tickets } from '@/lib/db/schema';
import type { FilterState } from '@/types/filters';

export function applyTicketFilters(
  baseConditions: (SQL | undefined)[],
  filters: FilterState,
): SQL | undefined {
  const conditions: (SQL | undefined)[] = [...baseConditions];

  if (filters.date) {
    conditions.push(gte(tickets.createdAt, new Date(filters.date.from + 'T00:00:00.000Z')));
    conditions.push(lte(tickets.createdAt, new Date(filters.date.to + 'T23:59:59.999Z')));
  }

  if (filters.teamMember && filters.teamMember.values.length > 0) {
    const values = filters.teamMember.values as number[];
    switch (filters.teamMember.operator) {
      case 'is':
        conditions.push(eq(tickets.assignedTo, values[0]));
        break;
      case 'isNot':
        conditions.push(ne(tickets.assignedTo, values[0]));
        break;
      case 'isAnyOf':
        conditions.push(inArray(tickets.assignedTo, values));
        break;
      case 'isNoneOf':
        conditions.push(notInArray(tickets.assignedTo, values));
        break;
    }
  }

  if (filters.ticketType && filters.ticketType.values.length > 0) {
    const values = filters.ticketType.values as number[];
    switch (filters.ticketType.operator) {
      case 'is':
        conditions.push(eq(tickets.ticketTypeId, values[0]));
        break;
      case 'isNot':
        conditions.push(ne(tickets.ticketTypeId, values[0]));
        break;
      case 'isAnyOf':
        conditions.push(inArray(tickets.ticketTypeId, values));
        break;
      case 'isNoneOf':
        conditions.push(notInArray(tickets.ticketTypeId, values));
        break;
    }
  }

  if (filters.priority && filters.priority.values.length > 0) {
    const values = filters.priority.values as string[];
    switch (filters.priority.operator) {
      case 'is':
        conditions.push(eq(tickets.priority, values[0]));
        break;
      case 'isNot':
        conditions.push(ne(tickets.priority, values[0]));
        break;
      case 'isAnyOf':
        conditions.push(inArray(tickets.priority, values));
        break;
      case 'isNoneOf':
        conditions.push(notInArray(tickets.priority, values));
        break;
    }
  }

  return and(...conditions);
}
