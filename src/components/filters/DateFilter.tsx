'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DateFilter as DateFilterType } from '@/types/filters';

const LazyDateFilterCalendar = dynamic(() => import('./DateFilterCalendar'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-3 md:flex-row">
      <Skeleton className="h-[280px] w-[280px] rounded-lg" />
      <Skeleton className="hidden h-[280px] w-[280px] rounded-lg md:block" />
    </div>
  ),
});

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
  const [open, setOpen] = useState(false);

  const selectedRange: DateRange | undefined = value
    ? {
        from: parseLocalDate(value.from),
        to: parseLocalDate(value.to),
      }
    : undefined;

  function handleSelect(range: DateRange | undefined) {
    if (!range?.from || !range?.to) return;

    onChange({
      from: toDateStr(range.from),
      to: toDateStr(range.to),
    });
    setOpen(false);
  }

  const label = selectedRange?.from && selectedRange?.to
    ? `${format(selectedRange.from, 'MMM d, yyyy')} - ${format(selectedRange.to, 'MMM d, yyyy')}`
    : 'Select date range';

  return (
    <div className="inline-flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'h-8 px-2.5 bg-secondary/50 hover:bg-secondary border rounded-md text-sm flex items-center gap-2 transition-colors cursor-pointer',
              !selectedRange && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <LazyDateFilterCalendar selected={selectedRange} onSelect={handleSelect} />
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
