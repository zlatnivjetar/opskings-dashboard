export type FilterOperator = 'is' | 'isNot' | 'isAnyOf' | 'isNoneOf';

export const MULTI_FILTER_OPERATORS: ReadonlyArray<{ value: FilterOperator; label: string }> = [
  { value: 'is', label: 'is' },
  { value: 'isNot', label: 'is not' },
  { value: 'isAnyOf', label: 'is any of' },
  { value: 'isNoneOf', label: 'is none of' },
];

export type DateFilter = {
  from: string; // ISO date string
  to: string; // ISO date string
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
