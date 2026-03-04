'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  is: 'is',
  isNot: 'is not',
  isAnyOf: 'is any of',
  isNoneOf: 'is none of',
};

const SINGLE_OPERATORS: FilterOperator[] = ['is', 'isNot'];

function formatLabel(label: string, filter: MultiFilterType, options: SelectOption[]): string {
  const op = OPERATOR_LABELS[filter.operator];
  const selectedLabels = filter.values
    .map((v) => options.find((o) => o.value === v)?.label ?? String(v))
    .slice(0, 2);
  const suffix =
    filter.values.length > 2 ? ` +${filter.values.length - 2} more` : '';
  return `${label} ${op} ${selectedLabels.join(', ')}${suffix}`;
}

export function MultiSelectFilter({
  label,
  value,
  options,
  onChange,
  onRemove,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const isSingleSelect = SINGLE_OPERATORS.includes(value.operator);

  function handleOperatorChange(op: FilterOperator) {
    const newIsSingle = SINGLE_OPERATORS.includes(op);
    // Trim to single value if switching to a single-select operator
    const newValues =
      newIsSingle && value.values.length > 1 ? [value.values[0]] : value.values;
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
  const displayLabel =
    value.values.length > 0
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
        <Select
          value={value.operator}
          onValueChange={(v) => handleOperatorChange(v as FilterOperator)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
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
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50',
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
