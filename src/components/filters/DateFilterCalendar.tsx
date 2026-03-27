'use client';

import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';

export default function DateFilterCalendar({
  onSelect,
  selected,
}: {
  onSelect: (value: DateRange | undefined) => void;
  selected: DateRange | undefined;
}) {
  return (
    <Calendar
      mode="range"
      selected={selected}
      onSelect={onSelect}
      numberOfMonths={2}
    />
  );
}
