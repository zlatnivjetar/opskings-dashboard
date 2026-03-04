import { and, eq, ne, inArray, notInArray, gte, lte, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { tickets } from '@/lib/db/schema';
import type { FilterState } from '@/types/filters';

function endOfDay(dateStr: string): Date {
  return new Date(dateStr + 'T23:59:59.999Z');
}

export function applyTicketFilters(
  baseConditions: (SQL | undefined)[],
  filters: FilterState,
): SQL | undefined {
  const conditions: (SQL | undefined)[] = [...baseConditions];

  if (filters.date) {
    const { operator, value, valueTo } = filters.date;
    switch (operator) {
      case 'exact':
        conditions.push(sql`date_trunc('day', ${tickets.createdAt}) = ${value}::date`);
        break;
      case 'range':
        conditions.push(
          and(
            gte(tickets.createdAt, new Date(value)),
            lte(tickets.createdAt, endOfDay(valueTo ?? value)),
          ),
        );
        break;
      case 'onOrBefore':
        conditions.push(lte(tickets.createdAt, endOfDay(value)));
        break;
      case 'onOrAfter':
        conditions.push(gte(tickets.createdAt, new Date(value)));
        break;
    }
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
