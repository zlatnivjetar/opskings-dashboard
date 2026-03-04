import {
  pgTable,
  serial,
  varchar,
  numeric,
  timestamp,
  integer,
  boolean,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Tables ───────────────────────────────────────────────────────────────────

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).default('active'),
  planType: varchar('plan_type', { length: 50 }),
  monthlyBudget: numeric('monthly_budget', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  department: varchar('department', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const ticketTypes = pgTable('ticket_types', {
  id: serial('id').primaryKey(),
  typeName: varchar('type_name', { length: 100 }).notNull(),
  department: varchar('department', { length: 50 }).notNull(),
  priority: varchar('priority', { length: 20 }),
  avgResolutionHours: integer('avg_resolution_hours'),
});

export const tickets = pgTable(
  'tickets',
  {
    id: serial('id').primaryKey(),
    clientId: integer('client_id').notNull().references(() => clients.id),
    assignedTo: integer('assigned_to').references(() => teamMembers.id),
    ticketTypeId: integer('ticket_type_id').notNull().references(() => ticketTypes.id),
    status: varchar('status', { length: 50 }).default('open'),
    priority: varchar('priority', { length: 20 }),
    title: varchar('title', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_tickets_type_created').on(table.ticketTypeId, table.createdAt),
    index('idx_tickets_assigned_status').on(table.assignedTo, table.status),
    index('idx_tickets_priority_status').on(table.priority, table.status),
    index('idx_tickets_client_created').on(table.clientId, table.createdAt),
    index('idx_tickets_created_status').on(table.createdAt, table.status),
  ],
);

export const ticketMessages = pgTable('ticket_messages', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  fromClient: boolean('from_client').default(false),
  fromTeamMemberId: integer('from_team_member_id').references(() => teamMembers.id),
  messageText: text('message_text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const ticketFeedback = pgTable('ticket_feedback', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id).unique(),
  rating: integer('rating'),
  feedbackText: text('feedback_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    clientId: integer('client_id').notNull().references(() => clients.id),
    amountUsd: numeric('amount_usd', { precision: 10, scale: 2 }).notNull(),
    paymentType: varchar('payment_type', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).default('pending'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_payments_client_status').on(table.clientId, table.status),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const clientsRelations = relations(clients, ({ many }) => ({
  tickets: many(tickets),
  payments: many(payments),
}));

export const teamMembersRelations = relations(teamMembers, ({ many }) => ({
  tickets: many(tickets),
  ticketMessages: many(ticketMessages),
}));

export const ticketTypesRelations = relations(ticketTypes, ({ many }) => ({
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  client: one(clients, { fields: [tickets.clientId], references: [clients.id] }),
  agent: one(teamMembers, { fields: [tickets.assignedTo], references: [teamMembers.id] }),
  ticketType: one(ticketTypes, { fields: [tickets.ticketTypeId], references: [ticketTypes.id] }),
  messages: many(ticketMessages),
  feedback: one(ticketFeedback),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketMessages.ticketId], references: [tickets.id] }),
  teamMember: one(teamMembers, {
    fields: [ticketMessages.fromTeamMemberId],
    references: [teamMembers.id],
  }),
}));

export const ticketFeedbackRelations = relations(ticketFeedback, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketFeedback.ticketId], references: [tickets.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  client: one(clients, { fields: [payments.clientId], references: [clients.id] }),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export type TicketType = typeof ticketTypes.$inferSelect;
export type NewTicketType = typeof ticketTypes.$inferInsert;

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type NewTicketMessage = typeof ticketMessages.$inferInsert;

export type TicketFeedback = typeof ticketFeedback.$inferSelect;
export type NewTicketFeedback = typeof ticketFeedback.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
