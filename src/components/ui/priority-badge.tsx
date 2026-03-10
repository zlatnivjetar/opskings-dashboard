import { Badge } from '@/components/ui/badge';
import { PRIORITY_STYLES } from '@/lib/status-styles';

export function PriorityBadge({ priority }: { priority: string }) {
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  const dotColor = PRIORITY_STYLES[priority] ?? 'bg-muted-foreground';

  return (
    <Badge variant="outline" className="bg-gray-50 text-black dark:bg-gray-800 dark:text-white">
      {priority === 'urgent' ? (
        <span className="relative flex size-1.5 shrink-0">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotColor}`} />
          <span className={`relative inline-flex size-1.5 rounded-full ${dotColor}`} />
        </span>
      ) : (
        <span className={`size-1.5 shrink-0 rounded-full ${dotColor}`} />
      )}
      {label}
    </Badge>
  );
}
