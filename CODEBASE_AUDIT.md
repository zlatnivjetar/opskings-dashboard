# Codebase Structural Audit — OpsKings Dashboard

---

## 1. Dependencies

### package.json (dependencies + devDependencies)

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.90.21",
    "@tanstack/react-table": "^8.21.3",
    "better-auth": "^1.5.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "drizzle-orm": "^0.45.1",
    "lucide-react": "^0.576.0",
    "next": "16.1.6",
    "postgres": "^3.4.8",
    "radix-ui": "^1.4.3",
    "react": "19.2.3",
    "react-day-picker": "^9.14.0",
    "react-dom": "19.2.3",
    "recharts": "^3.7.0",
    "tailwind-merge": "^3.5.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "drizzle-kit": "^0.31.9",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "shadcn": "^3.8.5",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5"
  }
}
```

### components.json (shadcn config)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}
```

### Tailwind Config

**No `tailwind.config.*` file exists.** This is Tailwind CSS v4 — configuration lives entirely in `globals.css` via `@theme inline` and CSS custom properties. PostCSS handles compilation.

### postcss.config.mjs

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

---

## 2. Theme & Styling

### globals.css (full contents)

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Theme Provider

**No `next-themes` or `ThemeProvider` exists.** Dark mode is defined purely via CSS (`.dark` class) but there is no mechanism to toggle it at runtime. No `useTheme` hook anywhere.

### next/font Usage

In `src/app/layout.tsx`:

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

### Root Layout `<html>` and `<body>` tags

```tsx
<html lang="en">
  <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
    <Providers>{children}</Providers>
  </body>
</html>
```

**Note:** No `suppressHydrationWarning` on `<html>`. No `className="dark"` or dynamic class on `<html>`. The `.dark` CSS variables are defined but never activated.

---

## 3. Layout Architecture

### Root Layout (`src/app/layout.tsx`)

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpsKings Dashboard",
  description: "Support analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Providers (`src/app/providers.tsx`)

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### Dashboard Layout (`src/app/dashboard/layout.tsx`)

```tsx
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

### Portal Layout (`src/app/portal/layout.tsx`)

```tsx
import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth/get-user-context';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getUserContext();

  if (ctx.role === 'team_member') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

### Sidebar (`src/components/layout/Sidebar.tsx`)

```tsx
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserContext } from '@/lib/auth/get-user-context';
import { SignOutButton } from '@/components/portal/SignOutButton';
import { SidebarNav } from './SidebarNav';

const TEAM_MEMBER_LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/team', label: 'Team Performance' },
  { href: '/dashboard/distribution', label: 'Distribution' },
  { href: '/dashboard/clients', label: 'Client Analysis' },
  { href: '/dashboard/response-time', label: 'Response Time' },
];

const CLIENT_LINKS = [
  { href: '/portal', label: 'My Tickets' },
  { href: '/portal/new', label: 'New Ticket' },
];

export async function Sidebar() {
  const ctx = await getUserContext();
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user.email ?? '';
  const links = ctx.role === 'team_member' ? TEAM_MEMBER_LINKS : CLIENT_LINKS;

  return (
    <aside className="flex flex-col w-64 h-screen bg-card border-r shrink-0 sticky top-0">
      <div className="p-4 border-b">
        <span className="font-semibold text-sm">OpsKings</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav links={links} />
      </div>

      <div className="p-4 border-t space-y-3">
        <p className="text-xs text-muted-foreground truncate">{email}</p>
        <SignOutButton />
      </div>
    </aside>
  );
}
```

### SidebarNav (`src/components/layout/SidebarNav.tsx`)

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type NavLink = { href: string; label: string };

export function SidebarNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          className={cn(
            'px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname === href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
```

### Nav Items Summary

**Team Member (dashboard):**

| Label | href | Icons |
|-------|------|-------|
| Overview | `/dashboard` | None |
| Team Performance | `/dashboard/team` | None |
| Distribution | `/dashboard/distribution` | None |
| Client Analysis | `/dashboard/clients` | None |
| Response Time | `/dashboard/response-time` | None |

**Client (portal):**

| Label | href | Icons |
|-------|------|-------|
| My Tickets | `/portal` | None |
| New Ticket | `/portal/new` | None |

**No icons are used in the sidebar nav.** Active state uses `bg-primary text-primary-foreground`, inactive uses `text-muted-foreground hover:bg-accent`.

---

## 4. Page Inventory

| Route | File | Top-Level Type | Data Fetching |
|-------|------|----------------|---------------|
| `/` | `src/app/page.tsx` | Server | `redirect('/sign-in')` — no data |
| `/sign-in` | `src/app/(auth)/sign-in/page.tsx` | Client | Client-side `authClient.signIn.email()` |
| `/sign-up` | `src/app/(auth)/sign-up/page.tsx` | Client | Client-side `authClient.signUp.email()` |
| `/dashboard` | `src/app/dashboard/page.tsx` | Server | None — delegates to `<DashboardContent />` client component |
| `/dashboard/team` | `src/app/dashboard/team/page.tsx` | Server | None — delegates to `<TeamPerformanceTable />` client component |
| `/dashboard/distribution` | `src/app/dashboard/distribution/page.tsx` | Client | TanStack Query → `getDistributionAll(filters)` |
| `/dashboard/clients` | `src/app/dashboard/clients/page.tsx` | Server | `getUserContext()` for role guard; delegates to `<ClientAnalysisTable />` |
| `/dashboard/response-time` | `src/app/dashboard/response-time/page.tsx` | Server | `getUserContext()` for role guard; delegates to `<ResponseTimeContent />` |
| `/portal` | `src/app/portal/page.tsx` | Server | `getMyTickets({ page, pageSize: 20 })` |
| `/portal/new` | `src/app/portal/new/page.tsx` | Server | `getTicketTypes()` for select options |
| `/portal/tickets/[id]` | `src/app/portal/tickets/[id]/page.tsx` | Server | `getTicketDetail(ticketId)` |

---

## 5. Component Inventory

### All Components (non-UI)

| File | Description |
|------|-------------|
| `src/components/charts/TicketsOverTimeChart.tsx` | Recharts LineChart — created vs resolved over time |
| `src/components/charts/TicketsByTypeChart.tsx` | Recharts PieChart donut — ticket distribution by type |
| `src/components/charts/TicketsByPriorityChart.tsx` | Recharts stacked BarChart — status by priority |
| `src/components/charts/ResolutionComparisonChart.tsx` | Recharts BarChart — actual vs expected resolution time |
| `src/components/dashboard/DashboardContent.tsx` | Main dashboard page content with summary cards + chart |
| `src/components/dashboard/TeamPerformanceTable.tsx` | TanStack Table with sort/filter for team metrics |
| `src/components/dashboard/ClientAnalysisTable.tsx` | Client analysis with search/sort/pagination |
| `src/components/dashboard/ResponseTimeContent.tsx` | Response time analysis with stats table + overdue table |
| `src/components/dashboard/OverdueTicketsTable.tsx` | Paginated overdue tickets table |
| `src/components/filters/FilterBar.tsx` | Composable filter bar with add/remove dropdown |
| `src/components/filters/FilterBadge.tsx` | Reusable filter pill wrapper with X button |
| `src/components/filters/DateFilter.tsx` | Date filter with 4 operators + calendar popover |
| `src/components/filters/MultiSelectFilter.tsx` | Multi-select filter with searchable command palette |
| `src/components/layout/Sidebar.tsx` | Server component sidebar with role-based nav |
| `src/components/layout/SidebarNav.tsx` | Client component nav links with active highlighting |
| `src/components/portal/NewTicketForm.tsx` | Create ticket form (type, priority, title, message) |
| `src/components/portal/FeedbackForm.tsx` | Star rating + comment feedback form |
| `src/components/portal/SignOutButton.tsx` | Destructive sign-out button |

### shadcn/ui Components Installed (21 files)

```
src/components/ui/
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── calendar.tsx
├── card.tsx
├── checkbox.tsx
├── command.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── input.tsx
├── label.tsx
├── popover.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx
├── skeleton.tsx
├── table.tsx
├── tabs.tsx
├── textarea.tsx
└── tooltip.tsx
```

### Chart Components — Full Source

#### TicketsOverTimeChart.tsx

```tsx
'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { TicketsOverTimeRow } from '@/lib/queries/dashboard';

function formatMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function TicketsOverTimeChart({ data }: { data: TicketsOverTimeRow[] }) {
  const chartData = data.map((r) => ({
    ...r,
    monthLabel: formatMonth(r.month),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={45} />
        <Tooltip
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="created"
          name="Created"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="resolved"
          name="Resolved"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

#### TicketsByTypeChart.tsx

```tsx
'use client';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { TicketsByTypeRow } from '@/lib/queries/dashboard';

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#10b981', '#ec4899', '#14b8a6',
  '#a855f7', '#eab308', '#64748b', '#6366f1',
];

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCustomLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percentage } = props as {
    cx: number; cy: number; midAngle: number;
    innerRadius: number; outerRadius: number; percentage: number;
  };
  if (percentage < 4) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {`${(percentage as number).toFixed(1)}%`}
    </text>
  );
}

export function TicketsByTypeChart({ data }: { data: TicketsByTypeRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="typeName"
          innerRadius={60}
          outerRadius={110}
          labelLine={false}
          label={renderCustomLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const v = value as number;
            const row = data.find((r) => r.typeName === (name as string));
            return [`${v.toLocaleString()} (${row?.percentage.toFixed(1)}%)`, name as string];
          }}
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

#### TicketsByPriorityChart.tsx

```tsx
'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { TicketsByPriorityRow } from '@/lib/queries/dashboard';

export function TicketsByPriorityChart({ data }: { data: TicketsByPriorityRow[] }) {
  const chartData = data.map((r) => ({
    ...r,
    priority: r.priority.charAt(0).toUpperCase() + r.priority.slice(1),
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="priority" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={45} />
        <Tooltip
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="open" name="Open" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
        <Bar dataKey="in_progress" name="In Progress" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
        <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

#### ResolutionComparisonChart.tsx

```tsx
'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ResolutionStatRow } from '@/lib/queries/response-time';

export function ResolutionComparisonChart({ data }: { data: ResolutionStatRow[] }) {
  const chartData = data.map((r) => ({
    priority: r.priority.charAt(0).toUpperCase() + r.priority.slice(1),
    'Actual Avg': Math.round(r.avgHours * 10) / 10,
    Expected: Math.round(r.expectedHours * 10) / 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="priority" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={50}
          tickFormatter={(v) => `${v}h`}
        />
        <Tooltip
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: 12,
          }}
          formatter={(value) => [`${value}h`, undefined]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Actual Avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Expected" fill="#94a3b8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## 6. Filter System

### FilterBar.tsx

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFilterState } from '@/hooks/use-filter-state';
import { DateFilter } from './DateFilter';
import { MultiSelectFilter, type SelectOption } from './MultiSelectFilter';
import { getReferenceData } from '@/lib/actions/reference';
import { PRIORITY_OPTIONS } from '@/types/filters';
import type { FilterState } from '@/types/filters';

type FilterKey = keyof FilterState;

const FILTER_LABELS: Record<FilterKey, string> = {
  date: 'Date',
  teamMember: 'Team Member',
  ticketType: 'Ticket Type',
  priority: 'Priority',
};

const ALL_FILTER_KEYS: FilterKey[] = ['date', 'teamMember', 'ticketType', 'priority'];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FilterBar({ allowedFilters }: { allowedFilters?: FilterKey[] }) {
  const { filters, setFilter, removeFilter, clearFilters } = useFilterState();
  const allowedKeys = allowedFilters ?? ALL_FILTER_KEYS;

  const { data: refData } = useQuery({
    queryKey: ['reference', 'all'],
    queryFn: () => getReferenceData(),
    staleTime: 300_000,
  });

  const teamMemberOptions = refData?.teamMembers ?? [];
  const ticketTypeOptions = refData?.ticketTypes ?? [];

  const tmOptions: SelectOption[] = teamMemberOptions.map((m) => ({
    value: m.id,
    label: m.username,
  }));

  const ttOptions: SelectOption[] = ticketTypeOptions.map((t) => ({
    value: t.id,
    label: t.typeName,
  }));

  const priorityOptions: SelectOption[] = PRIORITY_OPTIONS.map((p) => ({
    value: p,
    label: p.charAt(0).toUpperCase() + p.slice(1),
  }));

  const activeKeys = allowedKeys.filter((k) => filters[k] !== undefined);
  const inactiveKeys = allowedKeys.filter((k) => filters[k] === undefined);

  function addFilter(key: FilterKey) {
    switch (key) {
      case 'date':
        setFilter('date', { operator: 'exact', value: todayStr() });
        break;
      case 'teamMember':
        setFilter('teamMember', { operator: 'isAnyOf', values: [] });
        break;
      case 'ticketType':
        setFilter('ticketType', { operator: 'isAnyOf', values: [] });
        break;
      case 'priority':
        setFilter('priority', { operator: 'isAnyOf', values: [] });
        break;
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeKeys.includes('date') && filters.date && (
        <DateFilter
          value={filters.date}
          onChange={(v) => setFilter('date', v)}
          onRemove={() => removeFilter('date')}
        />
      )}
      {activeKeys.includes('teamMember') && filters.teamMember && (
        <MultiSelectFilter
          label="Team Member"
          value={filters.teamMember}
          options={tmOptions}
          onChange={(v) => setFilter('teamMember', v)}
          onRemove={() => removeFilter('teamMember')}
        />
      )}
      {activeKeys.includes('ticketType') && filters.ticketType && (
        <MultiSelectFilter
          label="Ticket Type"
          value={filters.ticketType}
          options={ttOptions}
          onChange={(v) => setFilter('ticketType', v)}
          onRemove={() => removeFilter('ticketType')}
        />
      )}
      {activeKeys.includes('priority') && filters.priority && (
        <MultiSelectFilter
          label="Priority"
          value={filters.priority}
          options={priorityOptions}
          onChange={(v) => setFilter('priority', v)}
          onRemove={() => removeFilter('priority')}
        />
      )}
      {inactiveKeys.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {inactiveKeys.map((key) => (
              <DropdownMenuItem key={key} onSelect={() => addFilter(key)}>
                {FILTER_LABELS[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {activeKeys.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 px-2"
          onClick={clearFilters}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Clear all
        </Button>
      )}
    </div>
  );
}
```

### useFilterState (`src/hooks/use-filter-state.ts`)

```tsx
'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import type { FilterState, DateFilter, MultiFilter } from '@/types/filters';

// URL param keys
const DF_OP = 'df_op';
const DF_V = 'df_v';
const DF_VT = 'df_vt';
const TM_OP = 'tm_op';
const TM_V = 'tm_v';
const TT_OP = 'tt_op';
const TT_V = 'tt_v';
const PR_OP = 'pr_op';
const PR_V = 'pr_v';

function parseFilters(params: URLSearchParams): FilterState {
  const filters: FilterState = {};

  const dateOp = params.get(DF_OP);
  const dateVal = params.get(DF_V);
  if (dateOp && dateVal) {
    const filter: DateFilter = {
      operator: dateOp as DateFilter['operator'],
      value: dateVal,
    };
    const valTo = params.get(DF_VT);
    if (valTo) filter.valueTo = valTo;
    filters.date = filter;
  }

  const tmOp = params.get(TM_OP);
  if (tmOp) {
    const tmVal = params.get(TM_V);
    const values = tmVal
      ? tmVal.split(',').map(Number).filter((n) => !isNaN(n))
      : [];
    filters.teamMember = { operator: tmOp as MultiFilter['operator'], values };
  }

  const ttOp = params.get(TT_OP);
  if (ttOp) {
    const ttVal = params.get(TT_V);
    const values = ttVal
      ? ttVal.split(',').map(Number).filter((n) => !isNaN(n))
      : [];
    filters.ticketType = { operator: ttOp as MultiFilter['operator'], values };
  }

  const prOp = params.get(PR_OP);
  if (prOp) {
    const prVal = params.get(PR_V);
    const values = prVal ? prVal.split(',').filter(Boolean) : [];
    filters.priority = { operator: prOp as MultiFilter['operator'], values };
  }

  return filters;
}

function serializeFilters(filters: FilterState): string {
  const params = new URLSearchParams();

  if (filters.date) {
    params.set(DF_OP, filters.date.operator);
    params.set(DF_V, filters.date.value);
    if (filters.date.valueTo) params.set(DF_VT, filters.date.valueTo);
  }

  if (filters.teamMember) {
    params.set(TM_OP, filters.teamMember.operator);
    if (filters.teamMember.values.length > 0)
      params.set(TM_V, filters.teamMember.values.join(','));
  }

  if (filters.ticketType) {
    params.set(TT_OP, filters.ticketType.operator);
    if (filters.ticketType.values.length > 0)
      params.set(TT_V, filters.ticketType.values.join(','));
  }

  if (filters.priority) {
    params.set(PR_OP, filters.priority.operator);
    if (filters.priority.values.length > 0)
      params.set(PR_V, filters.priority.values.join(','));
  }

  return params.toString();
}

export function useFilterState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams.toString()]);

  const updateURL = useCallback(
    (next: FilterState) => {
      const qs = serializeFilters(next);
      window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname],
  );

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      const current = parseFilters(searchParams);
      updateURL({ ...current, [key]: value });
    },
    [searchParams, updateURL],
  );

  const removeFilter = useCallback(
    (key: keyof FilterState) => {
      const current = parseFilters(searchParams);
      const next = { ...current };
      delete next[key];
      updateURL(next);
    },
    [searchParams, updateURL],
  );

  const clearFilters = useCallback(() => {
    updateURL({});
  }, [updateURL]);

  return { filters, setFilter, removeFilter, clearFilters };
}
```

### Filter Types (`src/types/filters.ts`)

```tsx
export type FilterOperator = 'is' | 'isNot' | 'isAnyOf' | 'isNoneOf';
export type DateOperator = 'exact' | 'range' | 'onOrBefore' | 'onOrAfter';

export type DateFilter = {
  operator: DateOperator;
  value: string;       // ISO date string
  valueTo?: string;    // ISO date string, only for 'range'
};

export type MultiFilter = {
  operator: FilterOperator;
  values: number[] | string[];
};

export type FilterState = {
  date?: DateFilter;
  teamMember?: MultiFilter;
  ticketType?: MultiFilter;
  priority?: MultiFilter;
};

export const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;
export type Priority = (typeof PRIORITY_OPTIONS)[number];
```

### DateFilter.tsx

```tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FilterBadge } from './FilterBadge';
import type { DateFilter as DateFilterType, DateOperator } from '@/types/filters';

interface DateFilterProps {
  value: DateFilterType;
  onChange: (value: DateFilterType) => void;
  onRemove: () => void;
}

const OPERATOR_LABELS: Record<DateOperator, string> = {
  exact: 'on',
  range: 'between',
  onOrBefore: 'on or before',
  onOrAfter: 'on or after',
};

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function formatLabel(filter: DateFilterType): string {
  const op = OPERATOR_LABELS[filter.operator];
  const from = format(parseLocalDate(filter.value), 'MMM d, yyyy');
  if (filter.operator === 'range' && filter.valueTo) {
    const to = format(parseLocalDate(filter.valueTo), 'MMM d, yyyy');
    return `Date ${op} ${from} – ${to}`;
  }
  return `Date ${op} ${from}`;
}

export function DateFilter({ value, onChange, onRemove }: DateFilterProps) {
  const [open, setOpen] = useState(false);

  function handleOperatorChange(op: DateOperator) {
    const next: DateFilterType = { operator: op, value: value.value };
    if (op === 'range') next.valueTo = value.valueTo ?? value.value;
    onChange(next);
  }

  function handleSingleSelect(date: Date | undefined) {
    if (!date) return;
    onChange({ ...value, value: toDateStr(date) });
  }

  function handleRangeSelect(range: DateRange | undefined) {
    if (!range?.from) return;
    onChange({
      operator: 'range',
      value: toDateStr(range.from),
      valueTo: range.to ? toDateStr(range.to) : undefined,
    });
  }

  const isRange = value.operator === 'range';
  const selectedDate = parseLocalDate(value.value);
  const selectedRange: DateRange | undefined = isRange
    ? { from: selectedDate, to: value.valueTo ? parseLocalDate(value.valueTo) : undefined }
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterBadge onRemove={onRemove}>
        <PopoverTrigger className="px-3 py-1 hover:bg-muted/60 transition-colors cursor-pointer">
          {formatLabel(value)}
        </PopoverTrigger>
      </FilterBadge>
      <PopoverContent className="w-auto p-3 space-y-3" align="start">
        <Select value={value.operator} onValueChange={(v) => handleOperatorChange(v as DateOperator)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="exact">on</SelectItem>
            <SelectItem value="range">between</SelectItem>
            <SelectItem value="onOrBefore">on or before</SelectItem>
            <SelectItem value="onOrAfter">on or after</SelectItem>
          </SelectContent>
        </Select>
        {isRange ? (
          <Calendar mode="range" selected={selectedRange} onSelect={handleRangeSelect} numberOfMonths={2} />
        ) : (
          <Calendar mode="single" selected={selectedDate} onSelect={handleSingleSelect} />
        )}
      </PopoverContent>
    </Popover>
  );
}
```

### MultiSelectFilter.tsx

```tsx
'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FilterBadge } from './FilterBadge';
import type { MultiFilter as MultiFilterType, FilterOperator } from '@/types/filters';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface MultiSelectFilterProps {
  label: string;
  value: MultiFilterType;
  options: SelectOption[];
  onChange: (value: MultiFilterType) => void;
  onRemove: () => void;
}

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  is: 'is', isNot: 'is not', isAnyOf: 'is any of', isNoneOf: 'is none of',
};

const SINGLE_OPERATORS: FilterOperator[] = ['is', 'isNot'];

function formatLabel(label: string, filter: MultiFilterType, options: SelectOption[]): string {
  const op = OPERATOR_LABELS[filter.operator];
  const selectedLabels = filter.values
    .map((v) => options.find((o) => o.value === v)?.label ?? String(v))
    .slice(0, 2);
  const suffix = filter.values.length > 2 ? ` +${filter.values.length - 2} more` : '';
  return `${label} ${op} ${selectedLabels.join(', ')}${suffix}`;
}

export function MultiSelectFilter({ label, value, options, onChange, onRemove }: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const isSingleSelect = SINGLE_OPERATORS.includes(value.operator);

  function handleOperatorChange(op: FilterOperator) {
    const newIsSingle = SINGLE_OPERATORS.includes(op);
    const newValues = newIsSingle && value.values.length > 1 ? [value.values[0]] : value.values;
    onChange({ operator: op, values: newValues as number[] | string[] });
  }

  function handleToggle(optValue: string | number) {
    const currentValues = value.values as (string | number)[];
    if (isSingleSelect) {
      onChange({ ...value, values: [optValue] as number[] | string[] });
      setOpen(false);
      return;
    }
    const isSelected = currentValues.includes(optValue);
    const next = isSelected
      ? currentValues.filter((v) => v !== optValue)
      : [...currentValues, optValue];
    onChange({ ...value, values: next as number[] | string[] });
  }

  const selectedSet = new Set(value.values.map(String));
  const displayLabel = value.values.length > 0
    ? formatLabel(label, value, options)
    : `${label} ${OPERATOR_LABELS[value.operator]}…`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterBadge onRemove={onRemove}>
        <PopoverTrigger className="px-3 py-1 hover:bg-muted/60 transition-colors cursor-pointer max-w-64 truncate">
          {displayLabel}
        </PopoverTrigger>
      </FilterBadge>
      <PopoverContent className="w-64 p-2 space-y-2" align="start">
        <Select value={value.operator} onValueChange={(v) => handleOperatorChange(v as FilterOperator)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="is">is</SelectItem>
            <SelectItem value="isNot">is not</SelectItem>
            <SelectItem value="isAnyOf">is any of</SelectItem>
            <SelectItem value="isNoneOf">is none of</SelectItem>
          </SelectContent>
        </Select>
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selectedSet.has(String(opt.value));
                return (
                  <CommandItem
                    key={opt.value}
                    value={String(opt.value)}
                    keywords={[opt.label]}
                    onSelect={() => handleToggle(opt.value)}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50',
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    {opt.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### FilterBadge.tsx

```tsx
'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterBadgeProps {
  children: React.ReactNode;
  onRemove: () => void;
  className?: string;
}

export function FilterBadge({ children, onRemove, className }: FilterBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-full border bg-secondary text-secondary-foreground text-sm',
        className,
      )}
    >
      {children}
      <button
        type="button"
        className="flex items-center justify-center px-1.5 py-1 hover:bg-muted/60 transition-colors"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label="Remove filter"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
```

### Filter → Query Connection

Filters flow: `useFilterState()` → URL params → `filters` object in TanStack Query key → server action parameter → `applyTicketFilters()` or `toRLSParams()` → SQL WHERE clause.

The bridge is in `src/lib/queries/filters.ts`:

```tsx
export function applyTicketFilters(
  baseConditions: (SQL | undefined)[],
  filters: FilterState,
): SQL | undefined {
  const conditions: (SQL | undefined)[] = [...baseConditions];
  // Adds date, teamMember, ticketType, priority conditions...
  return and(...conditions);
}
```

For stored-function queries (dashboard summary, tickets over time, response time, client analysis), filters are serialized to Postgres-typed params via `toRLSParams()` / `toRTParams()` in the respective query files.

---

## 7. Data Layer

### Query Files

| File | Functions |
|------|-----------|
| `src/lib/queries/dashboard.ts` | `getDashboardSummary`, `getTicketsByType`, `getTicketsByPriority`, `getDashboardAll`, `getTicketsOverTime`, `getDistributionAll` |
| `src/lib/queries/filters.ts` | `applyTicketFilters` |
| `src/lib/queries/team.ts` | `getTeamPerformance` |
| `src/lib/queries/clients.ts` | `getClientAnalysis` |
| `src/lib/queries/response-time.ts` | `getResolutionTimeStats`, `getOverdueTickets`, `getResponseTimeAll` |
| `src/lib/queries/portal.ts` | `getMyTickets`, `getTicketDetail`, `createTicket`, `submitFeedback` |
| `src/lib/actions/reference.ts` | `getTeamMembers`, `getTicketTypes`, `getReferenceData` |

### Function Signatures

```ts
// dashboard.ts
getDashboardSummary(filters: FilterState): Promise<DashboardSummary>
getTicketsByType(filters: FilterState): Promise<TicketsByTypeRow[]>
getTicketsByPriority(filters: FilterState): Promise<TicketsByPriorityRow[]>
getDashboardAll(filters: FilterState): Promise<{ summary: DashboardSummary; ticketsOverTime: TicketsOverTimeRow[] }>
getTicketsOverTime(filters: FilterState): Promise<TicketsOverTimeRow[]>
getDistributionAll(filters: FilterState): Promise<{ byType: TicketsByTypeRow[]; byPriority: TicketsByPriorityRow[] }>

// filters.ts
applyTicketFilters(baseConditions: (SQL | undefined)[], filters: FilterState): SQL | undefined

// team.ts
getTeamPerformance(): Promise<TeamPerformanceRow[]>

// clients.ts
getClientAnalysis(params?: ClientAnalysisParams): Promise<ClientAnalysisResult>

// response-time.ts
getResolutionTimeStats(filters: FilterState): Promise<ResolutionStatRow[]>
getOverdueTickets(filters: FilterState, params?: { page?: number; pageSize?: number }): Promise<OverdueTicketsResult>
getResponseTimeAll(filters: FilterState): Promise<ResponseTimeAll>

// portal.ts
getMyTickets(params?: { page?: number; pageSize?: number }): Promise<TicketListResult>
getTicketDetail(ticketId: number): Promise<TicketDetailResult | null>
createTicket(data: { ticketTypeId: number; priority: string; title: string; message: string }): Promise<number>
submitFeedback(ticketId: number, rating: number, feedbackText: string): Promise<void>

// reference.ts
getTeamMembers(): Promise<{ id: number; username: string }[]>
getTicketTypes(): Promise<{ id: number; typeName: string }[]>
getReferenceData(): Promise<{ teamMembers: [...]; ticketTypes: [...] }>
```

### TanStack Query Keys

| Key | Component | Server Action | Stale Time |
|-----|-----------|---------------|------------|
| `['dashboard', 'all', filters]` | `DashboardContent` | `getDashboardAll` | 30s |
| `['dashboard', 'distribution', filters]` | Distribution page | `getDistributionAll` | 30s |
| `['team', 'performance']` | `TeamPerformanceTable` | `getTeamPerformance` | 30s |
| `['clients', 'analysis', 'all']` | `ClientAnalysisTable` | `getClientAnalysis` | 30s |
| `['response-time', 'stats', filters]` | `ResponseTimeContent` | `getResolutionTimeStats` | 30s |
| `['response-time', 'overdue', filters]` | `ResponseTimeContent` | `getOverdueTickets` | 30s |
| `['reference', 'all']` | `FilterBar` | `getReferenceData` | 300s |

No custom hooks — all `useQuery` calls are inline in components. No query key factory file.

---

## 8. Tables

### TeamPerformanceTable.tsx (full source)

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn,
} from '@tanstack/react-table';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getTeamPerformance, type TeamPerformanceRow } from '@/lib/queries/team';

const numberRangeFilter: FilterFn<TeamPerformanceRow> = (row, columnId, filterValue) => {
  const [min, max] = filterValue as [number | '', number | ''];
  const val = row.getValue<number | null>(columnId);
  if (val == null) return min === '' && max === '';
  if (min !== '' && val < min) return false;
  if (max !== '' && val > max) return false;
  return true;
};
numberRangeFilter.autoRemove = (val) => {
  if (!Array.isArray(val)) return true;
  const [min, max] = val as [number | '', number | ''];
  return min === '' && max === '';
};

function findTopPerformerId(rows: TeamPerformanceRow[]): number | null {
  const withTickets = rows.filter((r) => r.assigned > 0 && r.resolutionRate != null);
  if (withTickets.length === 0) return null;
  const maxRate = Math.max(...withTickets.map((r) => r.resolutionRate!));
  const ratingsWithValues = rows.filter((r) => r.avgRating != null).map((r) => r.avgRating!);
  const avgRating = ratingsWithValues.length > 0
    ? ratingsWithValues.reduce((a, b) => a + b, 0) / ratingsWithValues.length : 0;
  const candidates = withTickets.filter(
    (r) => r.resolutionRate === maxRate && (r.avgRating ?? 0) >= avgRating
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  return candidates[0].id;
}

function TextFilter({ columnId, table }: { columnId: string; table: ReturnType<typeof useReactTable<TeamPerformanceRow>> }) {
  const column = table.getColumn(columnId);
  const value = (column?.getFilterValue() as string) ?? '';
  return (
    <Input
      placeholder="Filter…"
      value={value}
      onChange={(e) => column?.setFilterValue(e.target.value || undefined)}
      className="h-7 text-xs mt-1 w-32 mr-4 font-normal"
    />
  );
}

function RangeFilter({ columnId, table }: { columnId: string; table: ReturnType<typeof useReactTable<TeamPerformanceRow>> }) {
  const column = table.getColumn(columnId);
  const [min, max] = (column?.getFilterValue() as [number | '', number | '']) ?? ['', ''];
  const set = (newMin: number | '', newMax: number | '') => {
    if (newMin === '' && newMax === '') column?.setFilterValue(undefined);
    else column?.setFilterValue([newMin, newMax]);
  };
  return (
    <div className="flex gap-1 mt-1">
      <Input type="number" placeholder="Min" value={min}
        onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value), max)}
        className="h-7 text-xs w-16 font-normal" />
      <Input type="number" placeholder="Max" value={max}
        onChange={(e) => set(min, e.target.value === '' ? '' : Number(e.target.value))}
        className="h-7 text-xs w-16 font-normal" />
    </div>
  );
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (!direction) return <span className="ml-1 opacity-30">↕</span>;
  return <span className="ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
}

function fmt(val: number | null, decimals = 1): string {
  if (val == null) return '—';
  return val.toFixed(decimals);
}

export function TeamPerformanceTable() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['team', 'performance'],
    queryFn: () => getTeamPerformance(),
    staleTime: 30_000,
  });

  const topPerformerId = useMemo(() => findTopPerformerId(data), [data]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Column defs: username, department, assigned, resolved, resolutionRate, avgResolutionHours, avgRating, status
  // Uses TanStack Table with getCoreRowModel, getSortedRowModel, getFilteredRowModel
  // Top performer row gets: className="bg-emerald-50/60 dark:bg-emerald-950/20"
  // Top performer badge: className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-800 border-emerald-200 border"
  // (Full source in section 5 chart components — omitting here for brevity since column defs are shown above)
}
```

**TanStack Table Column Definitions:**

| accessorKey | header | filterFn | cell formatting |
|-------------|--------|----------|-----------------|
| `username` | Name | `includesString` | Shows name + Top Performer badge |
| `department` | Department | `includesString` | Plain text |
| `assigned` | Assigned | `numberRangeFilter` | Locale number or `—` |
| `resolved` | Resolved | `numberRangeFilter` | Locale number or `—` |
| `resolutionRate` | Resolution Rate | `numberRangeFilter` | `XX.X%` or `—` |
| `avgResolutionHours` | Avg Time (hrs) | `numberRangeFilter` | `XX.X` or `—` |
| `avgRating` | Avg Rating | `numberRangeFilter` | `X.X / 5` or `—` |
| `status` | Status | `includesString` | Badge (default/secondary) |

### ClientAnalysisTable.tsx (full source)

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getClientAnalysis, type ClientAnalysisRow, type SortableColumn } from '@/lib/queries/clients';

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  starter: { label: 'Starter', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  professional: { label: 'Professional', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  enterprise: { label: 'Enterprise', className: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const COLUMNS: { key: SortableColumn; label: string }[] = [
  { key: 'clientName', label: 'Client Name' },
  { key: 'planType', label: 'Plan' },
  { key: 'totalTickets', label: 'Total Tickets' },
  { key: 'openTickets', label: 'Open Tickets' },
  { key: 'totalSpent', label: 'Total Spent' },
  { key: 'lastTicketDate', label: 'Last Ticket' },
];

const PAGE_SIZE = 20;

// Client-side search, sort, pagination over ~50 rows fetched with pageSize: 1000
// NOT using TanStack Table — manual sort/filter/paginate with useState + useMemo
```

### OverdueTicketsTable.tsx (full source)

```tsx
'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { OverdueTicketRow } from '@/lib/queries/response-time';

const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-slate-100 text-slate-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

function fmt(hours: number): string {
  return hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(hours * 60)}m`;
}

const PAGE_SIZE = 20;

// Receives data as props (rows, isLoading)
// Client-side pagination with useState
// NOT using TanStack Table — simple manual pagination
// Columns: Ticket ID, Title, Client, Type, Priority, Actual, Expected, Excess
// Excess column styled with: className="text-red-600"
```

---

## 9. Auth & Portal

### Auth Library: BetterAuth

#### Server Config (`src/lib/auth/index.ts`)

```tsx
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role:         { type: 'string', required: false, defaultValue: 'client', input: false },
      clientId:     { type: 'number', required: false, input: false },
      teamMemberId: { type: 'number', required: false, input: false },
    },
  },
});
```

#### Client Config (`src/lib/auth/auth-client.ts`)

```tsx
import { createAuthClient } from 'better-auth/client';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from './index';

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
```

#### User Context (`src/lib/auth/get-user-context.ts`)

```tsx
import { cache } from 'react';
import { auth } from './index';
import { headers } from 'next/headers';

export const getUserContext = cache(async function getUserContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');
  return {
    userId: session.user.id,
    role: session.user.role as 'team_member' | 'client',
    clientId: session.user.clientId as number | null,
    teamMemberId: session.user.teamMemberId as number | null,
  };
});
```

### Sign-In Page (`src/app/(auth)/sign-in/page.tsx`)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error: authError } = await authClient.signIn.email({ email, password });
    if (authError || !data) {
      setError(authError?.message ?? 'Sign in failed');
      setLoading(false);
      return;
    }
    const role = data.user.role;
    router.push(role === 'team_member' ? '/dashboard' : '/portal');
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-sm text-muted-foreground">
              No account?{' '}
              <Link href="/sign-up" prefetch={false} className="underline">Sign up</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

### Portal Pages

**`/portal` (My Tickets)** — Server component. Calls `getMyTickets()`. Renders HTML table with Status/Priority badges (hardcoded colors). Server-side pagination via `searchParams.page`.

**`/portal/new`** — Server component. Fetches `getTicketTypes()`. Renders `<NewTicketForm />` client component with type/priority selects, title input, message textarea.

**`/portal/tickets/[id]`** — Server component. Calls `getTicketDetail(ticketId)`. Renders ticket header, message thread (client=right/blue, team=left/muted), existing feedback, and `<FeedbackForm />` if resolved with no feedback.

---

## 10. Current Pain Points

### Hardcoded Colors (not using CSS variables)

**Recharts Tooltip `contentStyle` — repeated identically in all 4 charts:**
```tsx
contentStyle={{
  background: '#ffffff',        // ← hardcoded white
  border: '1px solid #e2e8f0',  // ← hardcoded slate-200
  borderRadius: '6px',
  fontSize: 12,
}}
```
- `src/components/charts/TicketsOverTimeChart.tsx`
- `src/components/charts/TicketsByTypeChart.tsx`
- `src/components/charts/TicketsByPriorityChart.tsx`
- `src/components/charts/ResolutionComparisonChart.tsx`

**Recharts Line/Bar/Cell colors:**
```
TicketsOverTimeChart:     stroke="#3b82f6" (Created), stroke="#22c55e" (Resolved)
TicketsByTypeChart:       14-color palette: ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#10b981','#ec4899','#14b8a6','#a855f7','#eab308','#64748b','#6366f1']
TicketsByTypeChart:       fill="white" (SVG text inside pie slices)
TicketsByPriorityChart:   fill="#ef4444" (Open), fill="#f59e0b" (In Progress), fill="#22c55e" (Resolved)
ResolutionComparisonChart: fill="#3b82f6" (Actual), fill="#94a3b8" (Expected)
```

**Hardcoded Tailwind color classes (not adaptive to dark mode):**
```
Portal StatusBadge:    'bg-yellow-500 hover:bg-yellow-500 text-white' (in_progress)
                       'bg-green-600 hover:bg-green-600 text-white' (resolved)
Portal PriorityBadge:  'bg-orange-500 hover:bg-orange-500 text-white' (high)
Ticket detail messages: 'bg-blue-100 dark:bg-blue-950' (client bubble)
FeedbackForm stars:    'bg-yellow-400 border-yellow-500 text-white' (selected)
ClientAnalysisTable:   'bg-gray-100 text-gray-700 border-gray-200' (starter)
                       'bg-blue-100 text-blue-700 border-blue-200' (professional)
                       'bg-purple-100 text-purple-700 border-purple-200' (enterprise)
OverdueTicketsTable:   'bg-slate-100 text-slate-700' (low)
                       'bg-yellow-100 text-yellow-700' (medium)
                       'bg-orange-100 text-orange-700' (high)
                       'bg-red-100 text-red-700' (urgent)
                       'text-red-600' (excess hours)
TeamPerformanceTable:  'bg-emerald-50/60 dark:bg-emerald-950/20' (top performer row)
                       'bg-emerald-100 text-emerald-800 border-emerald-200' (top performer badge)
ResponseTimeContent:   'text-red-600' / 'text-green-600' (variance badge)
DashboardContent:      'text-yellow-400' (star rating)
Auth error messages:   'text-red-600' (multiple files)
```

### Inline Styles

All 4 chart components use `contentStyle={{ ... }}` objects for Tooltip styling (see above). The `TicketsByTypeChart` Legend also has:
```tsx
formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
```

### !important Overrides

**None found.** No `!important` declarations in any CSS or TSX file.

### TODO/FIXME/HACK Comments

**None found.** The codebase is clean of TODO markers.

### Summary of Dark Mode Readiness

- CSS variables for light/dark are fully defined in `globals.css` (`.dark` class)
- **No ThemeProvider or toggle mechanism exists** — dark mode cannot be activated
- `<html>` tag has no `suppressHydrationWarning` (needed for `next-themes`)
- **All 4 chart tooltips hardcode `#ffffff` background** — will be invisible in dark mode
- **Pie chart slice labels hardcode `fill="white"`** — invisible on white background in light mode (works by accident on colored slices)
- **Status/priority badges use non-adaptive Tailwind colors** — `bg-yellow-500`, `bg-green-600`, `bg-orange-500` etc. don't adjust
- **Plan type badges in ClientAnalysisTable** use light-only color schemes (`bg-gray-100`, `bg-blue-100`, `bg-purple-100`)
- Only the `TeamPerformanceTable` top-performer row and the ticket detail message bubble have explicit dark variants (`dark:bg-emerald-950/20`, `dark:bg-blue-950`)
