'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelectFilter, type SelectOption } from '@/components/filters/MultiSelectFilter';
import { useRouteSearchParams } from '@/hooks/use-route-search-params';
import {
  CLIENTS_TABLE_PAGE_PARAM,
  type ClientTableState,
  type SortOrder,
} from '@/lib/dashboard-route-state';
import { MULTI_FILTER_OPERATORS } from '@/types/filters';
import type { MultiFilter } from '@/types/filters';
import type { SortableColumn } from '@/lib/queries/clients';

type ClientControlsDraft = Pick<
  ClientTableState,
  | 'openMax'
  | 'openMin'
  | 'plan'
  | 'query'
  | 'sortBy'
  | 'sortOrder'
  | 'spentMax'
  | 'spentMin'
  | 'ticketsMax'
  | 'ticketsMin'
>;

const DEFAULT_DRAFT: ClientControlsDraft = {
  query: '',
  plan: undefined,
  ticketsMin: null,
  ticketsMax: null,
  openMin: null,
  openMax: null,
  spentMin: null,
  spentMax: null,
  sortBy: 'totalTickets',
  sortOrder: 'desc',
};

const SORT_OPTIONS: { label: string; value: SortableColumn }[] = [
  { label: 'Client Name', value: 'clientName' },
  { label: 'Plan', value: 'planType' },
  { label: 'Total Tickets', value: 'totalTickets' },
  { label: 'Open Tickets', value: 'openTickets' },
  { label: 'Total Spent', value: 'totalSpent' },
  { label: 'Last Ticket', value: 'lastTicketDate' },
];

const DIRECTION_OPTIONS: { label: string; value: SortOrder }[] = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
];

function toInputValue(value: number | null): string {
  return value == null ? '' : String(value);
}

function parseNumberInput(raw: string): number | null {
  if (raw.trim() === '') {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ClientAnalysisTableControls({
  initialState,
  planOptions,
}: {
  initialState: ClientTableState;
  planOptions: SelectOption[];
}) {
  const { isPending, replaceParams } = useRouteSearchParams();
  const [draft, setDraft] = useState<ClientControlsDraft>({
    query: initialState.query,
    plan: initialState.plan,
    ticketsMin: initialState.ticketsMin,
    ticketsMax: initialState.ticketsMax,
    openMin: initialState.openMin,
    openMax: initialState.openMax,
    spentMin: initialState.spentMin,
    spentMax: initialState.spentMax,
    sortBy: initialState.sortBy,
    sortOrder: initialState.sortOrder,
  });

  const applyFilters = () => {
    replaceParams(
      {
        clients_q: draft.query || null,
        clients_plan_op: draft.plan?.operator ?? null,
        clients_plan_v:
          draft.plan && draft.plan.values.length > 0
            ? draft.plan.values.map(String).join(',')
            : null,
        clients_tickets_min: draft.ticketsMin,
        clients_tickets_max: draft.ticketsMax,
        clients_open_min: draft.openMin,
        clients_open_max: draft.openMax,
        clients_spent_min: draft.spentMin,
        clients_spent_max: draft.spentMax,
        clients_sort: draft.sortBy === DEFAULT_DRAFT.sortBy ? null : draft.sortBy,
        clients_dir: draft.sortOrder === DEFAULT_DRAFT.sortOrder ? null : draft.sortOrder,
        [CLIENTS_TABLE_PAGE_PARAM]: null,
      },
      {
        clearKeys: [CLIENTS_TABLE_PAGE_PARAM],
      },
    );
  };

  const resetFilters = () => {
    setDraft(DEFAULT_DRAFT);
    replaceParams({
      clients_q: null,
      clients_plan_op: null,
      clients_plan_v: null,
      clients_tickets_min: null,
      clients_tickets_max: null,
      clients_open_min: null,
      clients_open_max: null,
      clients_spent_min: null,
      clients_spent_max: null,
      clients_sort: null,
      clients_dir: null,
      [CLIENTS_TABLE_PAGE_PARAM]: null,
    });
  };

  const updatePlan = (value: MultiFilter | undefined) => {
    setDraft((current) => ({
      ...current,
      plan: value,
    }));
  };

  return (
    <form
      className="mb-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters();
      }}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="clients-query">
            Search
          </label>
          <Input
            id="clients-query"
            value={draft.query}
            onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))}
            placeholder="Client name"
            className="h-9 w-full min-w-56 xl:w-72"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Plan</label>
          <div>
            <MultiSelectFilter
              label="Plan"
              placeholder="Filter plans"
              value={draft.plan}
              operator={draft.plan?.operator ?? 'isAnyOf'}
              operatorOptions={MULTI_FILTER_OPERATORS}
              options={planOptions}
              onOperatorChange={(operator) =>
                updatePlan({
                  operator,
                  values:
                    operator === 'is' || operator === 'isNot'
                      ? (draft.plan?.values ?? []).slice(0, 1)
                      : (draft.plan?.values ?? []),
                })
              }
              onChange={(value) => updatePlan(value)}
              onClear={() => updatePlan(undefined)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="clients-sort">
            Sort By
          </label>
          <select
            id="clients-sort"
            className="h-9 min-w-40 rounded-md border bg-background px-3 text-sm"
            value={draft.sortBy}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                sortBy: event.target.value as SortableColumn,
              }))
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="clients-direction">
            Direction
          </label>
          <select
            id="clients-direction"
            className="h-9 min-w-36 rounded-md border bg-background px-3 text-sm"
            value={draft.sortOrder}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                sortOrder: event.target.value as SortOrder,
              }))
            }
          >
            {DIRECTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Total Tickets</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={toInputValue(draft.ticketsMin)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  ticketsMin: parseNumberInput(event.target.value),
                }))
              }
              className="h-9"
            />
            <Input
              type="number"
              placeholder="Max"
              value={toInputValue(draft.ticketsMax)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  ticketsMax: parseNumberInput(event.target.value),
                }))
              }
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Open Tickets</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={toInputValue(draft.openMin)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  openMin: parseNumberInput(event.target.value),
                }))
              }
              className="h-9"
            />
            <Input
              type="number"
              placeholder="Max"
              value={toInputValue(draft.openMax)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  openMax: parseNumberInput(event.target.value),
                }))
              }
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Total Spent</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={toInputValue(draft.spentMin)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  spentMin: parseNumberInput(event.target.value),
                }))
              }
              className="h-9"
            />
            <Input
              type="number"
              placeholder="Max"
              value={toInputValue(draft.spentMax)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  spentMax: parseNumberInput(event.target.value),
                }))
              }
              className="h-9"
            />
          </div>
        </div>

        <div className="flex items-end gap-2 md:justify-end">
          <Button type="submit" size="sm" disabled={isPending}>
            Apply
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters} disabled={isPending}>
            Reset
          </Button>
        </div>
      </div>
    </form>
  );
}
