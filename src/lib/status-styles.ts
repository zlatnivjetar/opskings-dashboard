export const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/15 text-warning-foreground dark:bg-warning/20 dark:text-warning',
  high: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
  urgent: 'bg-destructive/25 text-destructive font-semibold dark:bg-destructive/30',
};

export const STATUS_STYLES: Record<string, string> = {
  open: 'bg-info/15 text-info dark:bg-info/20',
  in_progress: 'bg-warning/15 text-warning-foreground dark:bg-warning/20 dark:text-warning',
  resolved: 'bg-success/15 text-success dark:bg-success/20',
};

export const PLAN_STYLES: Record<string, { label: string; className: string }> = {
  starter: { label: 'Starter', className: 'bg-muted text-muted-foreground' },
  professional: { label: 'Professional', className: 'bg-info/15 text-info' },
  enterprise: { label: 'Enterprise', className: 'bg-primary/15 text-primary' },
};
