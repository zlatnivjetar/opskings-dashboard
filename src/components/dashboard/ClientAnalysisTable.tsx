'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MultiSelectFilter, type SelectOption } from '@/components/filters/MultiSelectFilter';
import { PlanBadge } from '@/components/ui/plan-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, ArrowUpDown, ListFilter, Search, X } from 'lucide-react';
import {
  type ClientAnalysisResult,
  type ClientAnalysisRow,
  type SortableColumn,
} from '@/lib/queries/clients';
import { cn } from '@/lib/utils';
import { MULTI_FILTER_OPERATORS, type FilterOperator, type MultiFilter } from '@/types/filters';

// ─── Formatting ───────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// ─── Filter state ─────────────────────────────────────────────────────────

type ClientFilters = {
  name: string;
  plan?: MultiFilter;
  ticketsMin: number | '';
  ticketsMax: number | '';
  openMin: number | '';
  openMax: number | '';
  spentMin: number | '';
  spentMax: number | '';
};

const DEFAULT_FILTERS: ClientFilters = {
  name: '',
  plan: undefined,
  ticketsMin: '',
  ticketsMax: '',
  openMin: '',
  openMax: '',
  spentMin: '',
  spentMax: '',
};

// ─── Sort helpers ─────────────────────────────────────────────────────────

type Column = { key: SortableColumn; label: string };

const COLUMNS: Column[] = [
  { key: 'clientName', label: 'Client Name' },
  { key: 'planType', label: 'Plan' },
  { key: 'totalTickets', label: 'Total Tickets' },
  { key: 'openTickets', label: 'Open Tickets' },
  { key: 'totalSpent', label: 'Total Spent' },
  { key: 'lastTicketDate', label: 'Last Ticket' },
];

const PAGE_SIZE = 20;

function migratePlanFilter(
  current: ClientFilters['plan'],
  operator: FilterOperator,
): ClientFilters['plan'] {
  const currentValues = (current?.values ?? []) as string[];
  const values = operator === 'is' || operator === 'isNot' ? currentValues.slice(0, 1) : currentValues;

  return values.length > 0 ? { operator, values } : undefined;
}

function compareRows(
  a: ClientAnalysisRow,
  b: ClientAnalysisRow,
  sortBy: SortableColumn,
  sortOrder: 'asc' | 'desc'
): number {
  const aVal = a[sortBy];
  const bVal = b[sortBy];
  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return 1;
  if (bVal == null) return -1;
  const cmp =
    typeof aVal === 'string'
      ? aVal.localeCompare(bVal as string)
      : (aVal as number) - (bVal as number);
  return sortOrder === 'asc' ? cmp : -cmp;
}

// ─── Sort icon ────────────────────────────────────────────────────────────

function SortIcon({ active, order }: { active: boolean; order: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-35" />;
  return order === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5" />
    : <ArrowDown className="h-3.5 w-3.5" />;
}

// ─── Text filter popover ──────────────────────────────────────────────────

function TextFilterPopover({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isActive = value.length > 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'rounded p-0.5 hover:bg-muted transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <ListFilter className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-3 space-y-2"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Input
          placeholder="Filter…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs"
          autoFocus
        />
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-xs"
            onClick={() => onChange('')}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Range filter popover ─────────────────────────────────────────────────

function RangeFilterPopover({
  label,
  min,
  max,
  onMin,
  onMax,
  onClear,
}: {
  label: string;
  min: number | '';
  max: number | '';
  onMin: (v: number | '') => void;
  onMax: (v: number | '') => void;
  onClear: () => void;
}) {
  const isActive = min !== '' || max !== '';
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'rounded p-0.5 hover:bg-muted transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <ListFilter className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-3 space-y-2"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex gap-1.5">
          <Input
            type="number"
            placeholder="Min"
            value={min}
            onChange={(e) => onMin(e.target.value === '' ? '' : Number(e.target.value))}
            className="h-7 text-xs"
            autoFocus
          />
          <Input
            type="number"
            placeholder="Max"
            value={max}
            onChange={(e) => onMax(e.target.value === '' ? '' : Number(e.target.value))}
            className="h-7 text-xs"
          />
        </div>
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-xs"
            onClick={onClear}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Main table component ─────────────────────────────────────────────────

export function ClientAnalysisTable() {
  const [filters, setFilters] = useState<ClientFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortableColumn>('totalTickets');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', 'analysis', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/clients/analysis?page=1&pageSize=1000');
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json() as Promise<ClientAnalysisResult>;
    },
    staleTime: 30_000,
  });

  const setFilter = <K extends keyof ClientFilters>(key: K, value: ClientFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  // Client-side filtering
  const planOptions: SelectOption[] = useMemo(() => {
    const uniquePlans = new Set((data?.rows ?? []).map((row) => row.planType));
    return Array.from(uniquePlans).map((plan) => ({ value: plan, label: plan }));
  }, [data?.rows]);

  const filtered = useMemo(() => {
    const allRows = data?.rows ?? [];
    return allRows.filter((r) => {
      if (filters.name && !r.clientName.toLowerCase().includes(filters.name.toLowerCase())) return false;

      const planFilterValues = (filters.plan?.values ?? []) as string[];
      if (planFilterValues.length > 0) {
        const plan = r.planType;
        const hasMatch = planFilterValues.includes(plan);
        const operator = filters.plan?.operator ?? 'isAnyOf';

        if (operator === 'is' && plan !== planFilterValues[0]) return false;
        if (operator === 'isNot' && plan === planFilterValues[0]) return false;
        if (operator === 'isAnyOf' && !hasMatch) return false;
        if (operator === 'isNoneOf' && hasMatch) return false;
      }

      if (filters.ticketsMin !== '' && r.totalTickets < filters.ticketsMin) return false;
      if (filters.ticketsMax !== '' && r.totalTickets > filters.ticketsMax) return false;
      if (filters.openMin !== '' && r.openTickets < filters.openMin) return false;
      if (filters.openMax !== '' && r.openTickets > filters.openMax) return false;
      if (filters.spentMin !== '' && (r.totalSpent ?? 0) < filters.spentMin) return false;
      if (filters.spentMax !== '' && (r.totalSpent ?? 0) > filters.spentMax) return false;
      return true;
    });
  }, [data?.rows, filters]);

  // Client-side sort
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareRows(a, b, sortBy, sortOrder)),
    [filtered, sortBy, sortOrder]
  );

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (col: SortableColumn) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const isFiltered =
    filters.name.length > 0 ||
    (filters.plan?.values.length ?? 0) > 0 ||
    filters.ticketsMin !== '' ||
    filters.ticketsMax !== '' ||
    filters.openMin !== '' ||
    filters.openMax !== '' ||
    filters.spentMin !== '' ||
    filters.spentMax !== '';

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg shadow-sm p-3 flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={filters.name}
            onChange={(e) => setFilter('name', e.target.value)}
            placeholder="Search client name"
            className="h-8 pl-8 pr-8 w-56"
          />
          {filters.name.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('name', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear client name search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="h-6 w-px bg-border shrink-0" aria-hidden="true" />

        <MultiSelectFilter
          label="Plan"
          placeholder="Select plan"
          value={filters.plan}
          operator={filters.plan?.operator ?? 'isAnyOf'}
          operatorOptions={MULTI_FILTER_OPERATORS}
          options={planOptions}
          onOperatorChange={(operator) => setFilter('plan', migratePlanFilter(filters.plan, operator))}
          onChange={(value) => setFilter('plan', value)}
          onClear={() => setFilter('plan', undefined)}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.key}
                  className="whitespace-nowrap select-none"
                >
                  <div className="flex items-center gap-1">
                    <div
                      className="cursor-pointer flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      <SortIcon active={sortBy === col.key} order={sortOrder} />
                    </div>
                    {col.key === 'clientName' && (
                      <TextFilterPopover
                        label="Client Name"
                        value={filters.name}
                        onChange={(v) => setFilter('name', v)}
                      />
                    )}
                    {col.key === 'totalTickets' && (
                      <RangeFilterPopover
                        label="Total Tickets"
                        min={filters.ticketsMin}
                        max={filters.ticketsMax}
                        onMin={(v) => setFilter('ticketsMin', v)}
                        onMax={(v) => setFilter('ticketsMax', v)}
                        onClear={() => setFilters((f) => ({ ...f, ticketsMin: '', ticketsMax: '' }))}
                      />
                    )}
                    {col.key === 'openTickets' && (
                      <RangeFilterPopover
                        label="Open Tickets"
                        min={filters.openMin}
                        max={filters.openMax}
                        onMin={(v) => setFilter('openMin', v)}
                        onMax={(v) => setFilter('openMax', v)}
                        onClear={() => setFilters((f) => ({ ...f, openMin: '', openMax: '' }))}
                      />
                    )}
                    {col.key === 'totalSpent' && (
                      <RangeFilterPopover
                        label="Total Spent ($)"
                        min={filters.spentMin}
                        max={filters.spentMax}
                        onMin={(v) => setFilter('spentMin', v)}
                        onMax={(v) => setFilter('spentMax', v)}
                        onClear={() => setFilters((f) => ({ ...f, spentMin: '', spentMax: '' }))}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {COLUMNS.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length}
                  className="text-center py-8 text-muted-foreground"
                >
                  No clients found
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.clientName}</TableCell>
                  <TableCell>
                    <PlanBadge plan={row.planType} />
                  </TableCell>
                  <TableCell>{row.totalTickets.toLocaleString()}</TableCell>
                  <TableCell>{row.openTickets.toLocaleString()}</TableCell>
                  <TableCell>
                    {row.totalSpent != null ? formatCurrency(row.totalSpent) : '—'}
                  </TableCell>
                  <TableCell>
                    {row.lastTicketDate ? formatDate(row.lastTicketDate) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {sorted.length.toLocaleString()} clients{isFiltered ? ' (filtered)' : ' total'}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={safePage <= 1}
            >
              Previous
            </Button>
            <span>
              Page {safePage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
