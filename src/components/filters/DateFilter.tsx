'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
    ? {
        from: selectedDate,
        to: value.valueTo ? parseLocalDate(value.valueTo) : undefined,
      }
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterBadge onRemove={onRemove}>
        <PopoverTrigger className="px-3 py-1 hover:bg-muted/60 transition-colors cursor-pointer">
          {formatLabel(value)}
        </PopoverTrigger>
      </FilterBadge>
      <PopoverContent className="w-auto p-3 space-y-3" align="start">
        <Select
          value={value.operator}
          onValueChange={(v) => handleOperatorChange(v as DateOperator)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="exact">on</SelectItem>
            <SelectItem value="range">between</SelectItem>
            <SelectItem value="onOrBefore">on or before</SelectItem>
            <SelectItem value="onOrAfter">on or after</SelectItem>
          </SelectContent>
        </Select>
        {isRange ? (
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleRangeSelect}
            numberOfMonths={2}
          />
        ) : (
          <Calendar mode="single" selected={selectedDate} onSelect={handleSingleSelect} />
        )}
      </PopoverContent>
    </Popover>
  );
}
