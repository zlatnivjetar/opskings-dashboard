'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DateFilter as DateFilterType, DateOperator } from '@/types/filters';

interface DateFilterProps {
  value: DateFilterType | undefined;
  operatorOptions: ReadonlyArray<{ value: DateOperator; label: string }>;
  onChange: (value: DateFilterType) => void;
  onOperatorChange: (operator: DateOperator) => void;
  onClear: () => void;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function DateFilter({ value, operatorOptions, onChange, onOperatorChange, onClear }: DateFilterProps) {
  const [open, setOpen] = useState(false);

  const operator = value?.operator ?? 'exact';
  const selectedDate = value?.value ? parseLocalDate(value.value) : undefined;

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    onChange({ operator, value: toDateStr(date) });
    setOpen(false);
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Select value={operator} onValueChange={(next) => onOperatorChange(next as DateOperator)}>
        <SelectTrigger className="h-8 w-[160px] bg-secondary/50 hover:bg-secondary border text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {operatorOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'h-8 px-2.5 bg-secondary/50 hover:bg-secondary border rounded-md text-sm flex items-center gap-2 transition-colors cursor-pointer',
              !selectedDate && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date'}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar mode="single" selected={selectedDate} onSelect={handleSelect} />
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
