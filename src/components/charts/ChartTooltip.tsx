import type { CSSProperties } from 'react';
import type { ChartColors } from '@/hooks/use-chart-theme';

export function tooltipStyle(colors: ChartColors): CSSProperties {
  return {
    background: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: 8,
    fontSize: 12,
    color: colors.tooltipText,
  };
}
