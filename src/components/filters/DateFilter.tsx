'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DateFilter as DateFilterType } from '@/types/filters';

interface DateFilterProps {
  value: DateFilterType | undefined;
  onChange: (value: DateFilterType) => void;
  onClear: () => void;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function DateFilter({ value, onChange, onClear }: DateFilterProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const fromDate = value?.value ? parseLocalDate(value.value) : undefined;
  const toDate = value?.valueTo ? parseLocalDate(value.valueTo) : undefined;

  function handleFromSelect(date: Date | undefined) {
    if (!date) return;
    onChange({
      operator: 'range',
      value: toDateStr(date),
      valueTo: value?.valueTo ?? toDateStr(date),
    });
    setFromOpen(false);
  }

  function handleToSelect(date: Date | undefined) {
    if (!date) return;
    onChange({
      operator: 'range',
      value: value?.value ?? toDateStr(date),
      valueTo: toDateStr(date),
    });
    setToOpen(false);
  }

  const triggerCls =
    'h-9 px-3 bg-secondary/50 hover:bg-secondary border rounded-md text-sm flex items-center gap-2 transition-colors cursor-pointer';

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground select-none">From</span>

      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger asChild>
          <button className={cn(triggerCls, !fromDate && 'text-muted-foreground')}>
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            {fromDate ? format(fromDate, 'MMM d, yyyy') : 'Start date'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar mode="single" selected={fromDate} onSelect={handleFromSelect} />
        </PopoverContent>
      </Popover>

      <span className="text-xs text-muted-foreground select-none">To</span>

      <Popover open={toOpen} onOpenChange={setToOpen}>
        <PopoverTrigger asChild>
          <button className={cn(triggerCls, !toDate && 'text-muted-foreground')}>
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            {toDate ? format(toDate, 'MMM d, yyyy') : 'End date'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={handleToSelect}
            disabled={fromDate ? (date: Date) => date < fromDate! : undefined}
          />
        </PopoverContent>
      </Popover>

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Clear date filter"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
