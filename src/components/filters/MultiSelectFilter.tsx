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
import type { MultiFilter as MultiFilterType } from '@/types/filters';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface MultiSelectFilterProps {
  label: string;
  placeholder: string;
  value: MultiFilterType | undefined;
  options: SelectOption[];
  onChange: (value: MultiFilterType) => void;
  onClear: () => void;
}

export function MultiSelectFilter({
  label,
  placeholder,
  value,
  options,
  onChange,
  onClear,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const selectedValues = (value?.values ?? []) as (string | number)[];
  const selectedSet = new Set(selectedValues.map(String));
  const count = selectedValues.length;

  function handleToggle(optValue: string | number) {
    const isSelected = selectedSet.has(String(optValue));
    const next = isSelected
      ? selectedValues.filter((v) => v !== optValue)
      : [...selectedValues, optValue];

    if (next.length === 0) {
      onClear();
    } else {
      onChange({ operator: 'isAnyOf', values: next as number[] | string[] });
    }
  }

  const triggerLabel = count === 0 ? placeholder : `${label} (${count})`;

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'h-8 px-3 bg-secondary/50 hover:bg-secondary border rounded-md text-sm flex items-center gap-1.5 transition-colors cursor-pointer',
              count > 0 ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {triggerLabel}
            <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
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
