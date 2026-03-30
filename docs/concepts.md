# OpsKings Dashboard — Architectural Concepts

A plain-language guide to how this system is built and why. After reading this,
you should be able to answer questions like *"What happens when a support agent
needs to see tickets across multiple clients?"* or *"How would you add a new
role?"* without looking at the code.

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [Two Worlds, One Database](#2-two-worlds-one-database)
3. [Row-Level Security — The Invisible Bouncer](#3-row-level-security--the-invisible-bouncer)
4. [Authentication and Sessions](#4-authentication-and-sessions)
5. [The Lifecycle of a Request](#5-the-lifecycle-of-a-request)
6. [The Middleware Trick](#6-the-middleware-trick)
7. [Filters — One Language, Many Speakers](#7-filters--one-language-many-speakers)
8. [Data Fetching — Why Not Just Call the Database?](#8-data-fetching--why-not-just-call-the-database)
9. [Charts and the Color Problem](#9-charts-and-the-color-problem)
10. [Extending the System](#10-extending-the-system)

**Estimated reading time: ~10 minutes**

---

## 1. The Big Picture

OpsKings is a support analytics dashboard that serves two distinct audiences
from the same codebase:

- **Team members** (support agents, managers) see everything — all tickets
  across all clients, team performance metrics, response-time analytics,
  and client health scores.
- **Clients** see only their own tickets. They can submit new ones, read
  messages, and track status — but they have no visibility into other clients'
  data or internal team metrics.

The system manages roughly 40,000 tickets across 50 clients and 15 team
members. It is not a ticketing system in the Zendesk sense — it is the
*analytics layer* that sits on top of ticket data and makes it useful for
operational decisions.

### The core tension

The entire architecture is shaped by one tension: **team members and clients
share the same tables, but must see radically different slices of data.** Every
significant design decision — from how the database is queried, to how routes
are organized, to how the middleware works — exists to resolve this tension
safely.

---

## 2. Two Worlds, One Database

Instead of building two separate apps or maintaining two sets of API endpoints,
the system uses a single database and a single codebase, but splits the user
experience at three levels:

### Level 1 — Route separation

Team members and clients never share a URL. Team members live under `/dashboard`,
`/team`, `/clients`, and `/response-time`. Clients live under `/portal`. These
are separate route groups with separate layouts, separate sidebars, and separate
navigation. A team member who somehow navigates to `/portal` gets redirected
back to `/dashboard`, and vice versa.

### Level 2 — Query scoping

When a client loads their ticket list, the query only asks for tickets belonging
to that client's organization. When a team member loads the dashboard, the query
asks for all tickets (optionally filtered by date, agent, or priority). The
*same* database tables are involved, but the question being asked is different.

### Level 3 — Database enforcement (RLS)

Even if the application code had a bug — even if a clever client crafted a raw
API request — the database itself would refuse to return another client's data.
This is the deepest and most important layer, and it deserves its own section.

---

## 3. Row-Level Security — The Invisible Bouncer

Row-Level Security (RLS) is a PostgreSQL feature that lets you attach visibility
rules directly to tables. Think of it as a filter that the database applies
*automatically* before returning any rows, regardless of what the query asks
for.

### How it works here

The application connects to Postgres as a superuser (the "admin" connection).
But every time it runs a query on behalf of a real user, it does three things
inside a transaction:

1. **Switches identity.** It tells Postgres: *"For the rest of this
   transaction, pretend I'm a restricted role called `rls_user`."* This
   restricted role has RLS policies enforced on it.

2. **Sets session variables.** It writes the current user's role, client ID, and
   team member ID into Postgres session variables — essentially, temporary
   sticky notes that the database can read while deciding what to show.

3. **Runs the actual query.** Postgres checks the RLS policies, reads the
   session variables, and filters the results accordingly.

When the transaction ends, the identity switch and the session variables are
automatically discarded. The next request starts fresh.

### What the policies actually say

The rules are straightforward:

| If you are a...   | You can see...                                  |
| ------------------ | ----------------------------------------------- |
| **Team member**    | All tickets, all clients, all payments           |
| **Client**         | Only tickets, messages, and payments tied to your organization |

There are also *write* rules. For example, when a client posts a message on a
ticket, the database verifies that the ticket belongs to that client *and* that
the message is correctly marked as coming from a client (not from a team
member). This prevents impersonation at the database level.

### Why this matters

RLS is the safety net beneath everything else. The application code *also*
scopes queries correctly, but RLS means a bug in the application code cannot
escalate into a data leak. If someone bypasses the middleware, forges a session,
or exploits a query parameter — the database still says no.

This is a defense-in-depth strategy. The application layer is the first line of
defense. The database is the last.

### The "context" pattern

Every data-fetching function receives a "user context" object that contains the
user's role, client ID, and team member ID. This context is extracted from the
authenticated session on the server and threaded through every query. The
function that wraps queries in an RLS transaction (called `withRLS` internally)
uses this context to set the session variables. You never construct a query
without it.

---

## 4. Authentication and Sessions

The system uses BetterAuth, a framework-agnostic authentication library, with
email/password credentials. Here is what happens when a user logs in:

1. BetterAuth validates the credentials and creates a session record in the
   database.
2. The session is written into a signed, HTTP-only cookie with a 7-day expiry.
3. On subsequent requests, the cookie is read and the session is validated.
   BetterAuth caches the session in the cookie itself (signed, so it cannot be
   tampered with) to avoid hitting the database on every single request.

### Roles live on the user record

Each user has a `role` field (`team_member` or `client`), a `clientId` (set for
clients, null for team members), and a `teamMemberId` (set for team members,
null for clients). These are set when the user is created and cannot be changed
through the signup form — they are admin-managed fields.

### Session to context

On the server side, a cached helper function reads the session from the incoming
request headers and returns a "user context" — a small object with just the
fields needed for authorization. Because it is wrapped in React's `cache()`
utility, it is computed at most once per server-side render, even if multiple
components need it.

---

## 5. The Lifecycle of a Request

Let's trace what happens when a support agent opens the dashboard:

1. **Browser requests `/dashboard`.** The request hits the middleware first.

2. **Middleware checks the session.** It calls an internal API endpoint to
   verify the user is logged in and has the `team_member` role. If not, it
   redirects to `/sign-in` or `/portal`.

3. **Server component renders.** The page is a server component. It reads the
   user context (cached), confirms the role, and renders the client component
   that contains the interactive dashboard.

4. **Client component mounts.** It initializes filters from URL parameters
   (date range, team member, priority, ticket type) and fires off data-fetching
   requests using TanStack Query.

5. **TanStack Query calls API routes.** Each section of the dashboard (summary
   cards, ticket trend chart, breakdown by type, breakdown by priority) has its
   own query. These requests go to lightweight API route handlers.

6. **API routes call server actions.** The route handler parses the filter
   parameters, loads the user context, and calls the appropriate server action.

7. **Server action opens an RLS transaction.** It switches to the `rls_user`
   role, sets the session variables, and runs the query. For dashboard analytics,
   it often calls a stored database function that does the heavy aggregation in
   Postgres rather than in JavaScript.

8. **Data flows back.** The query result travels back through the server action,
   API route, TanStack Query cache, and into the React component, which renders
   charts and tables.

For a client loading `/portal`, the flow is identical, except the middleware
confirms a `client` role, the queries are scoped to that client's data, and
RLS enforces the scoping at the database level even if the application logic
were wrong.

---

## 6. The Middleware Trick

Next.js middleware runs on the "Edge Runtime" — a lightweight JavaScript
environment that is fast but limited. Critically, it cannot use Node.js-specific
APIs, and the Postgres driver used in this project (postgres.js) depends on
those APIs.

This creates a problem: the middleware needs to check the user's session (which
is stored in the database), but it cannot talk to the database.

The solution is a self-fetch. The middleware makes an HTTP request to the
application's own `/api/auth/get-session` endpoint, which runs on the full
Node.js runtime and *can* talk to the database. The response tells the
middleware who the user is and what role they have.

This is slightly unusual — the server is calling itself — but it is the cleanest
way to bridge the gap between the Edge Runtime and the Node.js runtime without
duplicating authentication logic.

---

## 7. Filters — One Language, Many Speakers

Filters (date range, team member, ticket type, priority) are used across almost
every page. They need to work in three different contexts:

1. **In the browser URL** — so that a filtered view is shareable and
   bookmarkable. Filters are encoded as URL search parameters
   (`?df_from=2024-01-01&pr_op=is&pr_v=high`).

2. **Over the network** — when the client component sends a request to an API
   route, the filters are serialized as a JSON string in a query parameter.

3. **In the database** — where they become SQL conditions
   (e.g., `WHERE priority = 'high' AND created_at >= '2024-01-01'`).

The system defines a single filter format (a plain object with optional date,
team member, ticket type, and priority fields, each with an operator like "is",
"is not", "is any of", or "is none of") and provides translation functions for
each context. This means a filter set the same meaning regardless of whether it
is sitting in the URL bar, traveling as JSON, or being compiled to SQL.

A client-side hook manages filter state, reads initial values from the URL, and
updates the URL without triggering a full page reload. Each TanStack Query
includes the current filters in its cache key, so changing a filter
automatically triggers a fresh fetch.

---

## 8. Data Fetching — Why Not Just Call the Database?

You might wonder why there are API routes *and* server actions. Why not just call
the database directly from the client component?

Several reasons compound:

### Client components cannot run server code

React client components (anything with `useState`, `useEffect`, or event
handlers) run in the browser. They cannot import database drivers or server-only
modules. They need an HTTP endpoint to talk to.

### Next.js serializes concurrent server actions

If you fire five server actions at the same time from the same page, Next.js
will run them one after another, not in parallel. This is a framework-level
constraint. API route GET requests, on the other hand, run concurrently with
no serialization.

The solution used here is a hybrid: each independent section of the page has its
own TanStack Query calling its own API GET route. These requests run in parallel
because they are standard HTTP fetches. Inside each API route, the server action
is called once.

For the main dashboard, there is also an optimization where a single server
action fetches all four data slices in parallel (using `Promise.all`) and
returns them in one response, avoiding multiple round-trips when the queries
share the same filter context.

### Stored functions for heavy analytics

Some queries (like the dashboard summary, which calculates counts, averages, and
percentage changes across thousands of tickets) are written as Postgres stored
functions rather than Drizzle ORM queries. This keeps the heavy aggregation
inside the database engine, which is far more efficient than pulling raw rows
into Node.js and aggregating in JavaScript.

These stored functions accept filter parameters, apply RLS internally (they
switch roles and set session variables just like `withRLS` does), and return
pre-aggregated results. The application just passes the parameters in and gets
finished numbers back.

---

## 9. Charts and the Color Problem

The dashboard uses Recharts, a React charting library that renders SVG. SVG has
a quirk: its `fill` and `stroke` attributes need concrete color values. They do
not understand CSS variables (like `var(--primary)`) or modern CSS color
functions (like `oklch()`).

This is a problem because the rest of the application uses Tailwind CSS v4,
which internally uses `oklch()` for its color system and CSS variables for
theming. If you pass a Tailwind class color to a Recharts bar, it renders as
black or transparent.

The solution is a dedicated chart theming hook. It reads the current theme
(light or dark mode), maps it to a set of pre-computed hex color values, and
provides them to chart components. Charts never reference CSS variables or
Tailwind classes for their data colors — they always use these resolved hex
values.

Similarly, Recharts renders its tooltips in a detached DOM node where CSS
variables from the main page do not resolve. Tooltip backgrounds must be set
as literal hex values, not variable references.

This is a narrow but important constraint. Every chart in the system follows
this pattern, and ignoring it produces invisible or wrongly-colored charts
with no error message.

---

## 10. Extending the System

### "How would you add a new role?"

Suppose you wanted to add a `manager` role that can see all tickets but not
client billing data. Here is what you would touch:

1. **User record.** Add `'manager'` as a valid value for the `role` field on
   the user table. This is where the system learns the role exists.

2. **RLS policies.** Write new Postgres policies for the `manager` role (or
   modify existing ones). For example, on the `payments` table, you would create
   a policy that denies access when the session variable `app.user_role` is
   `'manager'`. On the `tickets` table, you might reuse the existing
   `team_member` policy by matching on either role.

3. **Middleware.** Update the route-matching logic so that managers are allowed
   to access certain routes and redirected away from others. If managers share
   the team member dashboard but not the clients page, you would add `manager`
   to the allowed roles for `/dashboard` and block it from `/clients`.

4. **Route guards.** Each server component that checks the role before rendering
   would need to include `manager` in its allowed list (or you would create a
   new route group for manager-specific pages).

5. **UI.** If the manager sees a different sidebar or different navigation
   items, you would add a branch in the layout component.

The key insight is that **security flows from the database up, not the UI
down.** You start with the RLS policies (what can this role physically see?),
then update the middleware (what routes can they reach?), and finally adjust the
UI (what do we show them?). If you only change the UI without updating RLS,
the data is still exposed to anyone who crafts a direct API request.

### "What happens when a support agent needs to see tickets across multiple clients?"

Nothing special — that is the default. A team member's RLS policy has no
client filter. When a team member queries the tickets table, every row is
visible. The agent can then filter by client, priority, date range, or team
member using the filter bar, but the *unfiltered* view already includes all
clients.

A client, by contrast, has an RLS policy that compares each ticket's `client_id`
to the `app.client_id` session variable. Even an unfiltered query returns only
that client's tickets.

### "How would you add a new table that needs RLS?"

1. Define the table in the schema file with a foreign key that connects it to
   the entity that owns the data (usually `clientId` or `teamMemberId`).

2. Write RLS policies for the new table. Follow the existing pattern: team
   members see all rows, clients see only rows where the `client_id` matches
   their session variable. Grant the `rls_user` role SELECT (and INSERT/UPDATE
   if needed) on the new table.

3. Every query against this table must go through `withRLS` — the function that
   switches to the `rls_user` role and sets the session variables. Never query
   the table using the bare admin connection in user-facing code.

4. If the table appears in an existing API route, the RLS filter applies
   automatically (that is the whole point). If it needs a new API route, follow
   the existing pattern: API route calls server action, server action calls
   `withRLS`, result flows back as JSON.

### "How would you add a new filter dimension?"

1. Add the new field to the filter type definition (the TypeScript type that
   describes the shape of a filter).

2. Add URL parameter keys for it in the filter state hook (e.g., `dept_op` and
   `dept_v` for a department filter).

3. Add a SQL condition branch in the `applyTicketFilters` function so the
   database knows how to interpret it.

4. Add a UI control in the filter bar component.

5. Update the serialization function so it can be sent as a JSON query
   parameter to API routes.

Because the filter system is unified, these changes propagate everywhere —
URL state, network requests, and database queries all understand the new
filter automatically.

---

## Summary of Key Principles

| Principle | How it shows up |
| --- | --- |
| **Defense in depth** | Application code scopes queries. RLS enforces scoping even if the code is wrong. |
| **Single source of truth** | One filter format, one badge color map, one chart theme hook. No parallel definitions. |
| **Security flows upward** | Start at the database (RLS), then middleware (route access), then UI (what to show). |
| **Separate experiences, shared infrastructure** | Team members and clients use different routes and layouts but the same tables, queries, and auth system. |
| **Constraints drive design** | Edge Runtime cannot use Postgres, so middleware self-fetches. SVG cannot use oklch(), so charts resolve hex colors. Next.js serializes server actions, so analytics use parallel API GETs. |
| **Collocate logic with its authority** | Aggregation happens in the database (stored functions), not in JavaScript. Filtering compiles to SQL, not in-memory loops. |
