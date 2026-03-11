export type FilterOperator = 'is' | 'isNot' | 'isAnyOf' | 'isNoneOf';
export type DateOperator = 'exact' | 'range' | 'onOrBefore' | 'onOrAfter';

export const MULTI_FILTER_OPERATORS: ReadonlyArray<{ value: FilterOperator; label: string }> = [
  { value: 'is', label: 'is' },
  { value: 'isNot', label: 'is not' },
  { value: 'isAnyOf', label: 'is any of' },
  { value: 'isNoneOf', label: 'is none of' },
];

export const DATE_FILTER_OPERATORS: ReadonlyArray<{ value: DateOperator; label: string }> = [
  { value: 'exact', label: 'exact date' },
  { value: 'range', label: 'date range' },
  { value: 'onOrBefore', label: 'date on or before' },
  { value: 'onOrAfter', label: 'date on or after' },
];

export type DateFilter = {
  operator: DateOperator;
  value: string;       // ISO date string
  valueTo?: string;    // ISO date string, only for 'range'
};

export type MultiFilter = {
  operator: FilterOperator;
  values: number[] | string[];
};

export type FilterState = {
  date?: DateFilter;
  teamMember?: MultiFilter;
  ticketType?: MultiFilter;
  priority?: MultiFilter;
};

export const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;
export type Priority = (typeof PRIORITY_OPTIONS)[number];
