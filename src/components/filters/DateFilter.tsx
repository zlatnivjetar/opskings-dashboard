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

function DatePickerButton({
  open,
  onOpenChange,
  selected,
  placeholder,
  onSelect,
  minDate,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  selected: Date | undefined;
  placeholder: string;
  onSelect: (date: Date | undefined) => void;
  minDate?: Date;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'h-8 px-2.5 bg-secondary/50 hover:bg-secondary border rounded-md text-sm flex items-center gap-2 transition-colors cursor-pointer',
            !selected && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
          {selected ? format(selected, 'MMM d, yyyy') : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          disabled={minDate ? (date: Date) => date < minDate : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DateFilter({ value, onChange, onClear }: DateFilterProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const fromDate = value?.value ? parseLocalDate(value.value) : undefined;
  const toDate = value?.valueTo ? parseLocalDate(value.valueTo) : undefined;

  function handleFromSelect(date: Date | undefined) {
    if (!date) return;
    const nextValue = toDateStr(date);
    const nextTo = toDate && toDate >= date ? toDateStr(toDate) : nextValue;
    onChange({ value: nextValue, valueTo: nextTo });
    setFromOpen(false);
  }

  function handleToSelect(date: Date | undefined) {
    if (!date) return;
    onChange({
      value: value?.value ?? toDateStr(date),
      valueTo: toDateStr(date),
    });
    setToOpen(false);
  }

  return (
    <div className="inline-flex items-center gap-1">
      <DatePickerButton
        open={fromOpen}
        onOpenChange={setFromOpen}
        selected={fromDate}
        placeholder="Start date"
        onSelect={handleFromSelect}
      />
      <DatePickerButton
        open={toOpen}
        onOpenChange={setToOpen}
        selected={toDate}
        placeholder="End date"
        onSelect={handleToSelect}
        minDate={fromDate}
      />

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
