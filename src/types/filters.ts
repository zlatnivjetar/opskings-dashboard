export type FilterOperator = 'is' | 'isNot' | 'isAnyOf' | 'isNoneOf';
export type DateOperator = 'exact' | 'range' | 'onOrBefore' | 'onOrAfter';

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
