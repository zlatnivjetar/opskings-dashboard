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

export function DateFilter({ value, operatorOptions, onChange, onOperatorChange, onClear }: DateFilterProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const operator = value?.operator ?? 'range';
  const fromDate = value?.value ? parseLocalDate(value.value) : undefined;
  const toDate = value?.valueTo ? parseLocalDate(value.valueTo) : undefined;

  function handleSingleSelect(date: Date | undefined) {
    if (!date) return;
    onChange({ operator, value: toDateStr(date) });
    setFromOpen(false);
  }

  function handleFromSelect(date: Date | undefined) {
    if (!date) return;
    const nextValue = toDateStr(date);
    const nextTo = toDate && toDate >= date ? toDateStr(toDate) : nextValue;
    onChange({ operator: 'range', value: nextValue, valueTo: nextTo });
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

  const isRange = operator === 'range';

  return (
    <div className="inline-flex items-center gap-1">
      <Select value={operator} onValueChange={(next) => onOperatorChange(next as DateOperator)}>
        <SelectTrigger className="h-8 w-[140px] bg-secondary/50 hover:bg-secondary border text-sm">
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

      {isRange ? (
        <>
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
        </>
      ) : (
        <DatePickerButton
          open={fromOpen}
          onOpenChange={setFromOpen}
          selected={fromDate}
          placeholder="Select date"
          onSelect={handleSingleSelect}
        />
      )}

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
