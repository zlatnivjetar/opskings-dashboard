// Dot color classes for priority/status/plan badge indicators

export const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-600 dark:bg-red-400',
  high:   'bg-orange-600 dark:bg-orange-400',
  medium: 'bg-blue-600 dark:bg-blue-400',
  low:    'bg-slate-500 dark:bg-slate-400',
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
