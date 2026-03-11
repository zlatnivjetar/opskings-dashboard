// Dot color classes for priority/status/plan badge indicators

export const PRIORITY_STYLES: Record<string, string> = {
  // Keep badges aligned with chart priority tokens and blue-only dashboard palette
  urgent: 'bg-blue-700 dark:bg-blue-200',
  high:   'bg-blue-600 dark:bg-blue-400',
  medium: 'bg-blue-400 dark:bg-blue-600',
  low:    'bg-blue-200 dark:bg-blue-700',
};

export const STATUS_STYLES: Record<string, string> = {
  open:        'bg-slate-400',
  in_progress: 'bg-amber-400',
  resolved:    'bg-emerald-400',
  active:      'bg-emerald-400',
  inactive:    'bg-slate-400',
};

export const PLAN_STYLES: Record<string, { label: string; dot: string }> = {
  starter:      { label: 'Starter',      dot: 'bg-slate-400 dark:bg-slate-500' },
  professional: { label: 'Professional', dot: 'bg-blue-300 dark:bg-blue-500' },
  enterprise:   { label: 'Enterprise',   dot: 'bg-blue-600 dark:bg-blue-400' },
};
