# OpsKings Dashboard — UI Overhaul Implementation Plan

## Context

This plan transforms the OpsKings support analytics dashboard from default shadcn/Recharts styling into a polished, production-grade application with full light/dark mode support, professional typography, higher information density, and cohesive design language.

The primary gap vs. the reference (competitor's dark dashboard) is not "dark mode" — it is **design consistency, density, type hierarchy, and statefulness**. This plan addresses all four.

### Stack (unchanged)
- Next.js 16, React 19, Tailwind CSS v4, shadcn/ui (new-york), Recharts 3.7, TanStack Query/Table, BetterAuth, Drizzle ORM, Supabase

### New dependencies (3)
- `next-themes` — theme toggling infrastructure
- `motion` (formerly framer-motion) — surgical micro-interactions
- `@playwright/cli` — visual regression baselines (devDependency)

### Design tokens
The full light/dark CSS variable palette is provided in a separate file (`design-tokens.css`). It defines semantic tokens for surfaces, brand, neutrals, status colors (success, warning, destructive, info), 6 chart colors, and sidebar-specific tokens — all in oklch.

---

## Phase 1 — Theme Infrastructure + Typography + Density System

**Goal:** Establish the visual foundation that every subsequent phase inherits. After this phase, the app should already look noticeably more professional even with no component changes.

**Estimated scope:** ~15 files touched

### 1A. Install `next-themes` and wire it up

```bash
npm install next-themes
```

**`src/app/layout.tsx`** — Wrap with ThemeProvider, add `suppressHydrationWarning`:
```tsx
import { ThemeProvider } from 'next-themes';

// In the return:
<html lang="en" suppressHydrationWarning>
  <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <Providers>{children}</Providers>
    </ThemeProvider>
  </body>
</html>
```

Note: `ThemeProvider` is a client component. Either import from a client wrapper or restructure `Providers` to include it. The cleanest approach is to add it inside `src/app/providers.tsx` alongside `QueryClientProvider`:

```tsx
"use client";
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

And in `layout.tsx`, add `suppressHydrationWarning` to `<html>`.

### 1B. Replace `globals.css` with new design tokens

Replace the entire `:root` and `.dark` blocks with the provided design token palette. Keep the existing `@import` statements, `@custom-variant`, `@theme inline`, and `@layer base` blocks.

The `@theme inline` block needs these additions for new tokens:
```css
--color-success: var(--success);
--color-success-foreground: var(--success-foreground);
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);
--color-info: var(--info);
--color-info-foreground: var(--info-foreground);
--color-chart-6: var(--chart-6);
```

### 1C. Typography system

Geist is already loaded via `next/font` — good. The problem is not the font but the **lack of a type hierarchy**. Add these utility classes to `globals.css` inside `@layer base`:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer utilities {
  /* Page-level title */
  .text-page-title {
    @apply text-2xl font-semibold tracking-tight;
  }
  /* Section/card title */
  .text-section-title {
    @apply text-base font-semibold tracking-tight;
  }
  /* KPI card label — uppercase micro text */
  .text-card-label {
    @apply text-[11px] font-semibold uppercase tracking-widest text-muted-foreground;
  }
  /* KPI card value — large number */
  .text-card-value {
    @apply text-2xl font-bold tracking-tight;
  }
  /* Table text default */
  .text-table {
    @apply text-sm;
  }
  /* Small helper text */
  .text-caption {
    @apply text-xs text-muted-foreground;
  }
}
```

### 1D. Density constants

Establish spacing/sizing conventions (documented here, applied in subsequent phases):

| Element | Current | Target |
|---------|---------|--------|
| Card padding | default (p-6) | `p-4` on cards, `p-5` on chart cards |
| Table row height | default | `h-10` (40px) via `py-2` on cells |
| Sidebar item height | `py-2 px-3` | `py-1.5 px-3` (tighter) |
| Filter bar height | varies | consistent `h-9` triggers |
| Page padding (main content) | none specified | `p-6` consistent |
| Gap between cards | none specified | `gap-4` |
| Section gap (card groups) | none specified | `gap-6` |

### 1E. Button fix

The audit notes the original plan mentions an "errant mt-4 mb-1" on button base CVA classes. Verify and remove if present in `src/components/ui/button.tsx`.

---

## Phase 2 — Sidebar Redesign

**Goal:** Transform the sidebar from a plain text list into a categorized, icon-rich, role-aware navigation with user profile section.

**Files:** `Sidebar.tsx`, `SidebarNav.tsx`

### Structure

```
┌──────────────────────┐
│ [Logo]  OpsKings     │  ← Header with icon
├──────────────────────┤
│ GENERAL              │  ← Category label
│ ● Dashboard          │  ← Icon + label, active state
│ ○ Response           │
│ ○ Teams              │
│ ○ Clients            │
├──────────────────────┤
│ SUPPORT              │  ← Category label
│ ○ Tickets            │
├──────────────────────┤
│                      │
│ ┌──────────────────┐ │
│ │ JS  John Smith   │ │  ← Avatar + name
│ │ SUPPORT AGENT    │ │  ← Role badge
│ │ john@company.com │ │  ← Email
│ │ [Sign out]       │ │
│ └──────────────────┘ │
└──────────────────────┘
```

### Implementation details

**`Sidebar.tsx`** — Keep as server component. Changes:
- Add logo icon (use a Lucide icon like `Crown` or `Shield` or simple SVG)
- Restructure nav links into categories
- Add user profile section with avatar initials circle, name (from session), role badge, email

**`SidebarNav.tsx`** — Changes:
- Accept categorized link structure: `{ category: string; items: NavItem[] }[]`
- Add Lucide icons per item: `LayoutDashboard`, `Clock`, `Users`, `Building2`, `Ticket`
- Category labels: uppercase, `text-[11px] font-semibold tracking-widest text-muted-foreground`, `mb-2 mt-4` spacing
- Active state: `bg-sidebar-accent text-sidebar-accent-foreground` with a `border-l-2 border-sidebar-primary` left accent
- Inactive: `text-sidebar-foreground hover:bg-sidebar-accent/50`
- Icon + label layout: `flex items-center gap-3` with icon at 18px

**Nav item mapping:**

| Category | Label | Icon | href |
|----------|-------|------|------|
| GENERAL | Dashboard | `LayoutDashboard` | `/dashboard` |
| GENERAL | Response | `Clock` | `/dashboard/response-time` |
| GENERAL | Teams | `Users` | `/dashboard/team` |
| GENERAL | Clients | `Building2` | `/dashboard/clients` |
| SUPPORT | Tickets | `Ticket` | `/dashboard/distribution` → will change in Phase 8 |

**Client portal nav:**

| Category | — | Label | Icon | href |
|----------|---|-------|------|------|
| — | — | My Tickets | `Ticket` | `/portal` |
| — | — | New Ticket | `PlusCircle` | `/portal/new` |

**User profile section:**
- Avatar: `w-8 h-8 rounded-full bg-primary text-primary-foreground` with initials
- Name: `text-sm font-medium`
- Role badge: `text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded`
- Email: `text-caption truncate`
- Sign out: keep existing `SignOutButton` but restyle to ghost/muted

### Theme toggle

Add a small theme toggle button in the sidebar header area (or footer). Use `useTheme()` from `next-themes` with Sun/Moon icons from Lucide. This is a client component — create `ThemeToggle.tsx` in `components/layout/`.

---

## Phase 3 — Filter Bar Redesign

**Goal:** Transform from popover-based add/remove pattern to a persistent, always-visible inline filter bar.

**Key constraint:** `useFilterState` hook and URL serialization are **untouched**. Only the rendering layer changes.

### New layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ From: [Jan 01, 2025]  To: [Dec 31, 2025]  │ Assignees... │ Types... │ Priorities... │  RESET  │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation

**`FilterBar.tsx`** — Full rewrite of the rendering. Keep the hook usage and data fetching identical.

Changes:
- Remove the "Add Filter" dropdown pattern
- Render all filters inline, always visible
- Date: two inline date triggers ("From" / "To") that open Calendar popovers. Default operator becomes `range`. From/To labels are small muted text above each trigger.
- Multi-selects: dropdown trigger buttons with placeholder text ("Assignees...", "Ticket types...", "Priorities..."). Clicking opens the existing Command palette popover.
- RESET button at the end: ghost style, only visible when any filter is active
- Container: `bg-card border rounded-lg p-3 flex items-center gap-3 flex-wrap`
- Each trigger: `h-9 px-3 bg-secondary/50 hover:bg-secondary border rounded-md text-sm`

**`DateFilter.tsx`** — Adapt to render as inline From/To pair instead of single badge:
- Accept new `mode: 'inline'` prop (or restructure entirely)
- "From" trigger shows start date, "To" trigger shows end date
- Each opens a single Calendar popover
- Remove operator selector (always `range` in inline mode)
- Keep the existing calendar popover internals

**`MultiSelectFilter.tsx`** — Simplify rendering:
- Remove operator selector (default to `isAnyOf`)
- Trigger shows: placeholder when empty, "2 selected" / "Team Member (3)" when populated
- Popover content stays the same (Command palette with search)

**`FilterBadge.tsx`** — becomes unused. Keep file but stop importing. Can delete in Phase 8 cleanup.

### Filter bar in page layouts

Currently each page renders `<FilterBar />` inline. After redesign, it should sit in a consistent position below the page title. No layout change needed — just ensure each page that uses `<FilterBar>` passes the same `allowedFilters` prop.

---

## Phase 4 — KPI Summary Cards

**Goal:** Replace the basic summary display with professional KPI cards matching the competitor's pattern.

### Card anatomy

```
┌────────────────────────┐
│ TOTAL TICKETS          │  ← text-card-label
│ 42.9K                  │  ← text-card-value
│ ▲ +12.3% vs last month │  ← trend indicator
│ All tickets in period  │  ← text-caption subtitle
└────────────────────────┘
```

### Implementation

**Create `src/components/dashboard/KpiCard.tsx`:**

Props:
```ts
interface KpiCardProps {
  label: string;        // "TOTAL TICKETS"
  value: string;        // "42.9K"
  subtitle?: string;    // "All tickets in period"
  trend?: {
    value: number;      // 12.3 (percentage)
    label: string;      // "vs last month"
  };
}
```

Rendering:
- Outer: `<Card className="p-4">`
- Label: `<p className="text-card-label">{label}</p>`
- Value: `<p className="text-card-value mt-1">{value}</p>`
- Trend badge (if present): `<span>` with `text-success` (positive) or `text-destructive` (negative), `text-xs font-medium`, `▲`/`▼` prefix
- Subtitle: `<p className="text-caption mt-1">{subtitle}</p>`

### Number formatting utility

**Create `src/lib/format.ts`:**
```ts
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)} hrs`;
}

export function formatPercent(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}
```

### "vs last period" comparison data

**Backend addition in `src/lib/queries/dashboard.ts`:**

Create `getDashboardWithComparison(filters)`:
- Calls `getDashboardSummary(filters)` for current period
- Computes a "previous period" by shifting the date filter back by the same duration (if date filter exists). If no date filter, skip comparison.
- Calls `getDashboardSummary(previousFilters)` 
- Both calls via `Promise.all`
- Returns `{ current: DashboardSummary; previous: DashboardSummary | null }`
- Client computes delta: `((current - previous) / previous * 100)`

Guard: if no date filter is active, `previous` is `null` and trend badges show "—" or are hidden.

### Apply to DashboardContent.tsx

Replace current summary rendering with a 4-column grid of `KpiCard`:
```
[TOTAL TICKETS] [OPEN TICKETS] [AVG RESOLUTION TIME] [CUSTOMER SATISFACTION]
```

Grid: `grid grid-cols-2 lg:grid-cols-4 gap-4`

### Apply to ResponseTimeContent.tsx

Add 4 KPI cards above the existing content:
```
[RESOLVED TICKETS] [MEDIAN RESOLUTION TIME] [AVG RESOLUTION TIME] [OVERDUE (count + %)]
```

This requires extending `getResponseTimeAll` to return `resolvedCount` and total ticket count. The overdue count and percentage come from existing stats data.

---

## Phase 5 — Chart Upgrades

**Goal:** Replace hardcoded colors with CSS variables, fix dark mode, and improve chart interactions.

### 5A. Shared chart utilities

**Create `src/lib/chart-theme.ts`:**
```ts
// CSS variable reader for Recharts (which needs actual color values, not var())
export function getCssVar(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getChartColors(): string[] {
  return [
    getCssVar('--chart-1'),
    getCssVar('--chart-2'),
    getCssVar('--chart-3'),
    getCssVar('--chart-4'),
    getCssVar('--chart-5'),
    getCssVar('--chart-6'),
  ].map(v => v ? `oklch(${v.replace('oklch(', '').replace(')', '')})` : '#888');
}

// Since oklch may not work directly in SVG fill/stroke,
// consider using a canvas-based approach or mapping to hex at runtime.
// Alternative: define chart colors as hex in a JS constant per theme.
```

**Important Recharts limitation:** Recharts uses SVG `fill` and `stroke` attributes which don't support CSS `oklch()` in all browsers. The safest approach is:

1. Define chart colors as CSS custom properties in globals.css (already done)
2. In chart components, use a hook that reads computed colors from the DOM
3. Or: define a parallel set of hex chart colors in JS and switch based on `useTheme().resolvedTheme`

**Create `src/hooks/use-chart-theme.ts`:**
```ts
'use client';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';

const LIGHT_COLORS = {
  chart1: '#5b5fc7', chart2: '#7c8cf5', chart3: '#4a63b8',
  chart4: '#7e97d4', chart5: '#6a5da8', chart6: '#8ba4cb',
  created: '#5b5fc7', resolved: '#22a06b',
  open: '#d93025', inProgress: '#f5a623', 
  actual: '#5b5fc7', expected: '#8ba4cb',
};

const DARK_COLORS = {
  chart1: '#7b7ff0', chart2: '#9aacf7', chart3: '#6a83d8',
  chart4: '#b8c8e8', chart5: '#8a7dc8', chart6: '#d4e0f0',
  created: '#7b7ff0', resolved: '#36b37e',
  open: '#ff5c5c', inProgress: '#f5c842',
  actual: '#7b7ff0', expected: '#d4e0f0',
};

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  return useMemo(() => resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS, [resolvedTheme]);
}
```

Note: Fine-tune these hex values to closely match the oklch tokens. They don't need to be pixel-perfect matches — they need to be **perceptually consistent** with the overall palette.

### 5B. Shared tooltip style

**Create `src/components/charts/ChartTooltip.tsx`:**
```ts
export function tooltipStyle(isDark: boolean) {
  return {
    background: isDark ? 'oklch(0.205 0.022 264)' : 'oklch(0.998 0.002 255)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'oklch(0.900 0.010 255)'}`,
    borderRadius: '8px',
    fontSize: 12,
    color: isDark ? 'oklch(0.965 0.006 255)' : 'oklch(0.235 0.025 264)',
  };
}
```

If oklch doesn't render in Recharts tooltip (it's regular CSS, not SVG), use hex fallbacks.

### 5C. TicketsOverTimeChart

Changes:
- `LineChart` → `BarChart` with grouped bars (Created / Resolved side by side)
- Use `useChartTheme()` for bar fill colors
- Add toggle tabs above chart: `All | Created | Resolved` — client-side filter on which bars to show
- Replace hardcoded tooltip style with `tooltipStyle()`
- Grid stroke: use `hsl(var(--border))` (already there, keep it)
- Axis tick color: `fill: 'hsl(var(--muted-foreground))'`

### 5D. TicketsByTypeChart (donut)

Changes:
- Replace hardcoded 14-color COLORS array with `useChartTheme()` chart1-6 cycling
- Add Top 5 | Top 8 | Top 12 toggle — client-side slice of data array before passing to Pie
- Add count/% toggle — switch `renderCustomLabel` between showing count vs percentage
- Fix `fill="white"` on slice labels → use `fill="hsl(var(--card-foreground))"` or compute at render
- Replace tooltip style with `tooltipStyle()`
- Legend text color: use CSS variable instead of inline style

### 5E. TicketsByPriorityChart

Changes:
- **Replace Recharts BarChart with custom Tailwind component.** The competitor uses a horizontal stacked progress bar with a breakdown list, not a vertical bar chart.
- Structure:
  ```
  Total: 42,060
  [=============================] ← horizontal stacked bar (colored segments)
  All | Open | Resolved          ← filter tabs
  
  ● Urgent   2,995   2,325 78%  +13.7 hrs
  ● High     9,329   7,194 77%  +13.2 hrs
  ● Medium  12,554   9,724 77%  +13.2 hrs
  ● Low      5,182   3,993 77%  +13.2 hrs
  ```
- The stacked bar is pure `div` with `flex` and percentage widths, colored with chart variables
- Each priority row shows: color dot, name, resolved count, overdue count + %, variance
- Filter tabs (All/Open/Resolved) filter which data subset is displayed
- This requires the distribution data — wire it through `getDashboardAll` or merge distribution queries into the dashboard page

### 5F. ResolutionComparisonChart → ResolutionHistogramChart

**Replace entirely.** The competitor shows a resolution time distribution histogram, not an actual-vs-expected comparison bar chart.

**Create `src/components/charts/ResolutionHistogramChart.tsx`:**
- Stacked bar histogram by priority in time bins
- Toggle: Fine | Standard | Coarse (different bin widths)
- Standard bins: 0-1h, 1-2h, 2-4h, 4-8h, 8-16h, 16+h
- Total resolved count displayed as header
- Subtitle: "Resolved tickets only, binned into fixed hour ranges."

**Backend addition:** `getResolutionHistogramData(filters)` — queries resolved tickets returning `{priority, hours}` rows. Client-side binning into the time buckets. This avoids complex SQL bucketing and keeps it flexible for the Fine/Standard/Coarse toggle.

**Delete** `ResolutionComparisonChart.tsx` after histogram is working.

---

## Phase 6 — Dashboard Page Layout

**Goal:** Restructure the main dashboard page to match the competitor's information architecture.

### New layout

```
Page Title + Filter Bar
[KPI] [KPI] [KPI] [KPI]                    ← 4-col grid (Phase 4)

[Tickets Over Time — bar chart         ]   [Tickets by Type — donut    ]
[col-span-2/3                           ]   [col-span-1/3               ]

[Tickets by Priority — full width stacked bar + breakdown list         ]
```

**`DashboardContent.tsx`** — Major rewrite:
- Page title: `<h1 className="text-page-title">Dashboard</h1>`
- Filter bar immediately below
- KPI cards in 4-col grid
- Two-column row: `grid grid-cols-1 lg:grid-cols-3 gap-4` — chart in `lg:col-span-2`, donut in `lg:col-span-1`
- Full-width priority section below

### Merging distribution data

Currently the distribution page (`/dashboard/distribution`) fetches `getDistributionAll(filters)` separately. Merge this into the main dashboard:

Option A (recommended): Extend `getDashboardAll` to also return `byType` and `byPriority` distribution data. Single TanStack Query call, single loading state.

Option B: Add a second `useQuery` for distribution data in `DashboardContent`. More queries but less backend change.

Go with Option A. Update the query key to `['dashboard', 'all-with-distributions', filters]`.

---

## Phase 7 — Response Time Page Overhaul

**Goal:** Match the competitor's response time layout.

### New layout

```
Page Title + Filter Bar
[RESOLVED TICKETS] [MEDIAN RESOLUTION] [AVG RESOLUTION] [OVERDUE]

[Resolution Histogram     ]  [Summary by Priority table  ]
[col-span-2/3             ]  [col-span-1/3               ]

[Overdue Tickets — full width table                       ]
```

### Changes to ResponseTimeContent.tsx

- Add 4 KPI cards (see Phase 4)
- Replace the "Resolution Time by Priority" stats table with a more compact "Summary by Priority" table:
  - Columns: Priority, Resolved, Overdue (count + %), Min, Median, Avg, Max, Δ vs Expected
  - Compact `text-sm` rows
- Replace `ResolutionComparisonChart` with `ResolutionHistogramChart` (Phase 5F)
- Two-column layout for histogram + summary table
- Overdue tickets table below (full width)

### OverdueTicketsTable changes

- Add "Created" date column (requires adding `created_at` to the `get_overdue_tickets_rls` SQL function return)
- Dark-adaptive priority badges (see Phase 8)
- Subtitle text: "Resolved tickets where actual resolution hours exceeded the expected hours for the ticket type."

---

## Phase 8 — Tables, Badges, and Status Colors

**Goal:** Replace all hardcoded Tailwind color classes with theme-aware alternatives.

### Create a shared badge/status system

**Create `src/lib/status-styles.ts`:**

```ts
// Priority badge styles — adaptive to light/dark
export const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-muted text-muted-foreground',
  medium: 'bg-warning/15 text-warning-foreground dark:bg-warning/20 dark:text-warning',
  high:   'bg-destructive/15 text-destructive dark:bg-destructive/20',
  urgent: 'bg-destructive/25 text-destructive font-semibold dark:bg-destructive/30',
};

// Status badge styles
export const STATUS_STYLES: Record<string, string> = {
  open:        'bg-info/15 text-info dark:bg-info/20',
  in_progress: 'bg-warning/15 text-warning-foreground dark:bg-warning/20 dark:text-warning',
  resolved:    'bg-success/15 text-success dark:bg-success/20',
};

// Client plan badge styles
export const PLAN_STYLES: Record<string, { label: string; className: string }> = {
  starter:      { label: 'Starter',      className: 'bg-muted text-muted-foreground' },
  professional: { label: 'Professional', className: 'bg-info/15 text-info' },
  enterprise:   { label: 'Enterprise',   className: 'bg-primary/15 text-primary' },
};
```

### Files to update

**`OverdueTicketsTable.tsx`:**
- Replace `PRIORITY_STYLES` hardcoded colors with import from `status-styles.ts`
- Replace `text-red-600` excess styling with `text-destructive`

**`ClientAnalysisTable.tsx`:**
- Replace `PLAN_BADGE` with import from `status-styles.ts`
- Replace hardcoded currency/date formatting with shared utilities

**`TeamPerformanceTable.tsx`:**
- Replace `bg-emerald-50/60 dark:bg-emerald-950/20` with `bg-success/10`
- Replace `bg-emerald-100 text-emerald-800 border-emerald-200` badge with `bg-success/15 text-success border-success/30`

**`ResponseTimeContent.tsx`:**
- Replace `text-red-600` / `text-green-600` variance with `text-destructive` / `text-success`

**`DashboardContent.tsx`:**
- Replace `text-yellow-400` star rating with `text-warning`

**Portal pages:**
- **`/portal` (My Tickets):** Update status/priority badge classes
- **`/portal/tickets/[id]`:** Replace `bg-blue-100 dark:bg-blue-950` message bubble with `bg-primary/10`
- **`FeedbackForm.tsx`:** Replace `bg-yellow-400 border-yellow-500` stars with `bg-warning border-warning`

**Auth pages:**
- Replace `text-red-600` error messages with `text-destructive`

---

## Phase 9 — Motion Polish

**Goal:** Add subtle, professional micro-interactions that signal quality without being distracting.

```bash
npm install motion
```

### Where to apply

| Element | Animation | Implementation |
|---------|-----------|----------------|
| Sidebar active indicator | Left border slides to active item | `layoutId` on the active border element |
| KPI cards | Fade + slide up on mount | `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` with staggered delay |
| Filter bar | Content height animation when filters change | `AnimatePresence` + `motion.div` with height auto |
| Chart cards | Subtle scale on hover | `whileHover={{ scale: 1.005 }}` with `transition={{ duration: 0.15 }}` — barely perceptible |
| Page transitions | Fade between dashboard sub-pages | `AnimatePresence` in dashboard layout — optional, only if it doesn't conflict with RSC streaming |
| Theme toggle | Sun/Moon icon rotation | `animate={{ rotate }}` on icon swap |

### Rules
- No animation longer than 200ms
- No spring physics on data-dense elements
- No animation on tables or table rows
- `prefers-reduced-motion` must be respected — wrap in `useReducedMotion()` check or use Motion's built-in support

---

## Phase 10 — Portal & Auth Polish

**Goal:** Ensure portal and auth pages are consistent with the new design system.

### Sign-in / Sign-up pages

- Already use shadcn Card — will inherit dark mode automatically
- Fix error text: `text-red-600` → `text-destructive`
- Add OpsKings logo/branding above the card
- Optional: add a subtle background pattern or gradient

### Portal pages

- `/portal` — verify ticket list table uses new badge styles
- `/portal/new` — verify form inputs render well in dark mode (they should, shadcn handles this)
- `/portal/tickets/[id]` — message thread bubbles need dark mode treatment:
  - Client messages (right): `bg-primary/10 text-foreground`
  - Team messages (left): `bg-muted text-foreground`
  - Timestamps: `text-caption`

---

## Phase 11 — Distribution Page Removal + Cleanup

**Goal:** Remove the now-redundant distribution page and clean up.

### Steps
1. Delete `src/app/dashboard/distribution/page.tsx`
2. Remove "Distribution" from sidebar nav links
3. Update the SUPPORT > Tickets link to point to the portal or remove it if team members don't need it
4. Optional: add a redirect from `/dashboard/distribution` → `/dashboard` in middleware for bookmarks
5. Delete `FilterBadge.tsx` if no longer imported anywhere
6. Delete `ResolutionComparisonChart.tsx`
7. Run `npx tsc --noEmit` to verify no broken imports
8. Run `npx next lint` to catch unused imports

---

## Phase 12 — Visual Regression Baselines

**Goal:** Capture screenshot baselines of every page in both light and dark mode.

### Setup

```bash
npm install -D @playwright/cli
npx playwright install chromium
```

### Create baseline script

**Create `scripts/capture-baselines.sh`:**
```bash
#!/bin/bash
# Captures full-page screenshots of every route in both themes
ROUTES=(
  "/sign-in"
  "/dashboard"
  "/dashboard/team"
  "/dashboard/clients"
  "/dashboard/response-time"
  "/portal"
)

for route in "${ROUTES[@]}"; do
  for theme in "light" "dark"; do
    echo "Capturing $route ($theme)"
    # Use Playwright CLI to navigate + screenshot
    # Set theme via localStorage or class toggle before capture
  done
done
```

Alternatively, write Playwright test specs:

**Create `e2e/visual-baselines.spec.ts`:**
```ts
import { test, expect } from '@playwright/test';

const routes = ['/sign-in', '/dashboard', '/dashboard/team', '/dashboard/clients', '/dashboard/response-time'];

for (const route of routes) {
  for (const theme of ['light', 'dark']) {
    test(`${route} — ${theme} mode`, async ({ page }) => {
      // Set theme
      await page.goto(`http://localhost:3000${route}`);
      await page.evaluate((t) => {
        document.documentElement.classList.toggle('dark', t === 'dark');
        document.documentElement.classList.toggle('light', t === 'light');
      }, theme);
      await page.waitForTimeout(500); // Allow repaints
      await expect(page).toHaveScreenshot(`${route.replace(/\//g, '-')}-${theme}.png`, {
        fullPage: true,
      });
    });
  }
}
```

This proves the polished state is stable and gives the evaluator confidence that you test what you ship.

---

## Implementation Order

```
Phase 1  — Theme + Typography + Density        [foundation, no backend]
Phase 2  — Sidebar                              [layout, no backend]
Phase 3  — Filter Bar                           [rendering only, no backend]
Phase 8  — Badges + Status Colors               [quick wins while theme is fresh]
Phase 4  — KPI Cards + Comparison Backend       [backend addition]
Phase 6  — Dashboard Page Layout                [composition of Phase 4+5 work]
Phase 5  — Chart Upgrades                       [visual, some new components]
Phase 7  — Response Time Page                   [backend addition + new histogram]
Phase 10 — Portal & Auth Polish                 [quick pass]
Phase 9  — Motion Polish                        [final layer]
Phase 11 — Distribution Cleanup                 [deletions]
Phase 12 — Visual Baselines                     [verification]
```

### Why this order

1. **Theme first** — every subsequent phase benefits from correct colors/typography
2. **Sidebar + Filter + Badges** — high visual impact, zero backend risk, builds momentum
3. **KPI Cards + Dashboard layout** — the biggest "wow" moment, done mid-project so there's time to iterate
4. **Charts** — depend on theme being stable
5. **Response time** — second biggest page, benefits from chart work already done
6. **Motion + cleanup** — polish layer, done last so it doesn't block core work
7. **Baselines** — final verification, captures the finished state

---

## Files Created/Modified Summary

### New files
| File | Purpose |
|------|---------|
| `design-tokens.css` | Light/dark CSS variable palette (provided separately) |
| `src/components/dashboard/KpiCard.tsx` | Reusable KPI summary card |
| `src/components/charts/ResolutionHistogramChart.tsx` | Resolution time distribution histogram |
| `src/components/charts/ChartTooltip.tsx` | Shared tooltip styling |
| `src/hooks/use-chart-theme.ts` | Theme-aware chart color hook |
| `src/components/layout/ThemeToggle.tsx` | Light/dark mode toggle |
| `src/lib/status-styles.ts` | Shared badge/status color definitions |
| `src/lib/format.ts` | Number/date/hours formatting utilities |
| `e2e/visual-baselines.spec.ts` | Playwright visual regression tests |

### Modified files (major changes)
| File | Change |
|------|--------|
| `src/app/globals.css` | New design tokens, typography utilities |
| `src/app/providers.tsx` | Add ThemeProvider |
| `src/app/layout.tsx` | Add suppressHydrationWarning |
| `src/components/layout/Sidebar.tsx` | Categorized nav, icons, user profile |
| `src/components/layout/SidebarNav.tsx` | Icons, categories, active state redesign |
| `src/components/filters/FilterBar.tsx` | Persistent inline layout |
| `src/components/filters/DateFilter.tsx` | Inline From/To mode |
| `src/components/filters/MultiSelectFilter.tsx` | Simplified trigger |
| `src/components/dashboard/DashboardContent.tsx` | New layout with KPIs + merged distribution |
| `src/components/dashboard/ResponseTimeContent.tsx` | KPIs + histogram + new layout |
| `src/components/dashboard/OverdueTicketsTable.tsx` | Created date column, adaptive badges |
| `src/components/dashboard/TeamPerformanceTable.tsx` | Adaptive badge colors |
| `src/components/dashboard/ClientAnalysisTable.tsx` | Adaptive plan badges |
| `src/components/charts/TicketsOverTimeChart.tsx` | LineChart → BarChart, theme colors |
| `src/components/charts/TicketsByTypeChart.tsx` | Theme colors, toggles |
| `src/components/charts/TicketsByPriorityChart.tsx` | Full rewrite to custom Tailwind component |
| `src/lib/queries/dashboard.ts` | getDashboardWithComparison, merged distribution data |
| `src/lib/queries/response-time.ts` | Histogram data query, extended stats |
| Portal pages (3 files) | Badge/message bubble dark mode |
| Auth pages (2 files) | Error text color |

### Deleted files
| File | Reason |
|------|--------|
| `src/components/charts/ResolutionComparisonChart.tsx` | Replaced by histogram |
| `src/app/dashboard/distribution/page.tsx` | Merged into main dashboard |

---

## Quality Checklist (per phase)

Before marking any phase complete:

- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npx next lint` passes (no lint errors)
- [ ] Toggle between light and dark mode — no hardcoded colors visible
- [ ] No `#ffffff`, `#e2e8f0`, `bg-white`, or hardcoded hex in new/modified files
- [ ] Card/table text is legible in both themes
- [ ] Chart tooltips are legible in both themes
- [ ] Filter bar functions correctly (filters apply, URL updates, reset works)
- [ ] No layout shifts or overflow on 1280px viewport width
