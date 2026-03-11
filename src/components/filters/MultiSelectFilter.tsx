'use client';

import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { FilterOperator, MultiFilter as MultiFilterType } from '@/types/filters';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface MultiSelectFilterProps {
  label: string;
  placeholder: string;
  value: MultiFilterType | undefined;
  options: SelectOption[];
  operatorOptions: ReadonlyArray<{ value: FilterOperator; label: string }>;
  onChange: (value: MultiFilterType) => void;
  onClear: () => void;
}

export function MultiSelectFilter({
  label,
  placeholder,
  value,
  options,
  operatorOptions,
  onChange,
  onClear,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const operator = value?.operator ?? 'isAnyOf';
  const selectedValues = (value?.values ?? []) as (string | number)[];
  const selectedSet = new Set(selectedValues.map(String));
  const count = selectedValues.length;
  const isSingleValueOperator = operator === 'is' || operator === 'isNot';

  function emit(operatorValue: FilterOperator, nextValues: (string | number)[]) {
    const normalized =
      operatorValue === 'is' || operatorValue === 'isNot' ? nextValues.slice(0, 1) : nextValues;

    if (normalized.length === 0) {
      onClear();
      return;
    }

    onChange({ operator: operatorValue, values: normalized as number[] | string[] });
  }

  function handleToggle(optValue: string | number) {
    const isSelected = selectedSet.has(String(optValue));
    const next = isSelected
      ? selectedValues.filter((v) => v !== optValue)
      : [...selectedValues, optValue];

    emit(operator, next);
  }

  function handleOperatorChange(nextOperator: FilterOperator) {
    emit(nextOperator, selectedValues);
  }

  const triggerLabel = count === 0 ? placeholder : `${label} (${count})`;

  return (
    <div className="inline-flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'h-8 px-2.5 bg-secondary/50 hover:bg-secondary border rounded-md text-sm flex items-center gap-1.5 transition-colors cursor-pointer',
              count > 0 ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {triggerLabel}
            <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
            <div className="px-1 pb-1">
              <div className="inline-flex h-9 rounded-md border bg-background p-0.5">
                {operatorOptions.map((option) => {
                  const active = option.value === operator;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleOperatorChange(option.value)}
                      className={cn(
                        'px-3 text-sm rounded-sm transition-colors',
                        active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
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
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0',
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
          {isSingleValueOperator && count > 0 && (
            <p className="pt-2 text-xs text-muted-foreground">Single-value operator: only the first selection is used.</p>
          )}
        </PopoverContent>
      </Popover>

      {count > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={`Clear ${label} filter`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
