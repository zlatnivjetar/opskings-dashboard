# Current Milestone: 3

## Completed

- [x] Milestone 0: Project Setup
- [x] Milestone 1: Drizzle Schema + Database Indexes
- [x] Milestone 2: BetterAuth Setup + User Schema

## Key Decisions (READ BEFORE EVERY MILESTONE)

After completing each milestone, append decisions that future milestones
depend on. Format: what was decided + where the code lives. Only include
decisions another session NEEDS to avoid breaking things. Skip obvious stuff.

Examples of good entries:
- Data queries use `withRLS()` from `src/lib/db/rls-client.ts` — never use bare `db` for user-facing queries
- BetterAuth session accessed via `auth.api.getSession({ headers: await headers() })`
- Filters sync to URL params via `useFilterState()` hook in `src/hooks/use-filter-state.ts`

- Both DB connections use Transaction Pooler (port 6543) — postgres.js clients MUST set `prepare: false` or queries will fail
- DB usernames include project ref suffix: `postgres.nlgkpveooqabtftreesr` / `rls_user.nlgkpveooqabtftreesr`
- `@/*` alias maps to `src/*` (not root) — keep all source under `src/`
- TanStack Query provider lives in `src/app/providers.tsx` (client component wrapping root layout)

- Drizzle schema is the source of truth for types — all 7 tables + relations in `src/lib/db/schema.ts`; inferred types exported from same file
- `drizzle-kit push` fails on this Supabase instance (CHECK constraint bug in drizzle-kit 0.31.x); use direct SQL or `drizzle-kit migrate` with hand-crafted migrations instead
- The generated migration `drizzle/0000_lively_terror.sql` reflects full schema but was NOT applied (tables pre-exist); composite indexes were applied directly via `CREATE INDEX IF NOT EXISTS`

- BetterAuth session accessed via `auth.api.getSession({ headers: await headers() })` — helper at `src/lib/auth/get-user-context.ts`
- Auth tables (user, session, account, verification) live in `src/lib/db/auth-schema.ts`; merged into main `db` instance in `src/lib/db/index.ts`
- Middleware uses self-fetch to `/api/auth/get-session` (postgres.js cannot run in Edge Runtime); don't import auth server directly in middleware
- `(dashboard)` and `(portal)` route groups were renamed to real segments `dashboard/` and `portal/` — middleware redirects to `/dashboard` and `/portal` as URL paths
- Seed script (`scripts/seed-auth-users.ts`) must use dynamic `await import('../src/lib/auth')` — static import is hoisted before dotenv loads, causing ECONNREFUSED
- additionalFields with `input: false` cannot be set during signup; seed patches them with direct SQL after `auth.api.signUpEmail`
- `npm run seed:auth` is idempotent — re-running updates existing users rather than failing

_(append here after each milestone)_

## Completion Protocol

When I type exactly **COMPLETED**, do the following:
1. Increment "Current Milestone" number to the next milestone
2. Check off the just-completed milestone in the Completed list
3. Append any Key Decisions from this milestone (only non-obvious ones that affect future work)
4. Write a brief implementation summary to `docs/implementation-log.md` (append, don't overwrite)

Do NOT update CLAUDE.md or the implementation log at any other time.
Do NOT treat partial phrases like "that's completed" or "I completed it" as the trigger.
Only the exact standalone input: **COMPLETED**

## Project Context

This is a support analytics dashboard for the OpsKings development interview.

**Tech stack:** Next.js 15 (App Router), TypeScript, Drizzle ORM, Supabase (PostgreSQL), BetterAuth, TanStack Query, Recharts, shadcn/ui, Tailwind CSS. Deployed on Vercel.

**Database:** ~40k tickets across 50 clients, 15 team members, 14 ticket types. Schema and seed already exist in `database/schema.sql` and `database/seed.sql`.

**Two user types:**
- Internal team members — full dashboard analytics access
- Client users — portal view, own data only

**RLS strategy:** BetterAuth handles auth at app layer. RLS enforced at DB layer via Postgres session variables (`set_config`) inside Drizzle transactions. Two DB connections: admin (superuser, bypasses RLS) and rls_user (non-superuser, RLS enforced).

**Performance targets:** Dashboard <500ms, filtered queries <1s, pagination <300ms, charts <800ms.
