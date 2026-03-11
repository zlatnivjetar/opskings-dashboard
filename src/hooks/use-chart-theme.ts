'use client';

import { useTheme } from 'next-themes';
import { useMemo } from 'react';

const LIGHT_COLORS = {
  // Chart palette — blue 900→100
  chart1: '#1e3a8a',
  chart2: '#1e40af',
  chart3: '#1d4ed8',
  chart4: '#2563eb',
  chart5: '#3b82f6',
  chart6: '#60a5fa',
  chart7: '#93c5fd',
  chart8: '#bfdbfe',
  chart9: '#dbeafe',
  // Semantic
  created: '#2563eb',
  resolved: '#93c5fd',
  open: '#d93025',
  inProgress: '#d08800',
  actual: '#5b5fc7',
  expected: '#7898b8',
  // Priority semantics (consistent across themes): urgent / high / medium / low
  urgent: '#dc2626',
  high: '#ea580c',
  medium: '#2563eb',
  low: '#64748b',
  // Tooltip
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e7eb',
  tooltipText: '#1f2937',
  // Grid / axis
  grid: '#e5e7eb',
  axis: '#6b7280',
};

const DARK_COLORS = {
  // Chart palette — blue 100→900
  chart1: '#dbeafe',
  chart2: '#bfdbfe',
  chart3: '#93c5fd',
  chart4: '#60a5fa',
  chart5: '#3b82f6',
  chart6: '#2563eb',
  chart7: '#1d4ed8',
  chart8: '#1e40af',
  chart9: '#1e3a8a',
  created: '#3b82f6',
  resolved: '#bfdbfe',
  open: '#ff5c5c',
  inProgress: '#f5c842',
  actual: '#7b7ff0',
  expected: '#b0c8e0',
  // Priority semantics (same mapping as light mode, dark-tuned tones)
  urgent: '#f87171',
  high: '#fb923c',
  medium: '#60a5fa',
  low: '#94a3b8',
  tooltipBg: '#1e1f2e',
  tooltipBorder: 'rgba(255,255,255,0.12)',
  tooltipText: '#f3f4f6',
  grid: 'rgba(255,255,255,0.08)',
  axis: '#9ca3af',
};

export type ChartColors = typeof LIGHT_COLORS;

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  return useMemo(
    () => (resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS),
    [resolvedTheme]
  );
}

/** Cycle through chart1–chart8 for series that need N colors */
export function chartPalette(colors: ChartColors, count: number): string[] {
  const base = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5, colors.chart6, colors.chart7, colors.chart8, colors.chart9];
  return Array.from({ length: count }, (_, i) => base[i % base.length]);
}

/** Priority → hex color from the chart theme */
export function priorityColor(colors: ChartColors, priority: string): string {
  const map: Record<string, string> = {
    urgent: colors.urgent,
    high: colors.high,
    medium: colors.medium,
    low: colors.low,
  };
  return map[priority] ?? colors.chart1;
}
