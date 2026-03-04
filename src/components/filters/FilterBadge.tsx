'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterBadgeProps {
  children: React.ReactNode;
  onRemove: () => void;
  className?: string;
}

export function FilterBadge({ children, onRemove, className }: FilterBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-full border bg-secondary text-secondary-foreground text-sm',
        className,
      )}
    >
      {children}
      <button
        type="button"
        className="flex items-center justify-center px-1.5 py-1 hover:bg-muted/60 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Remove filter"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
