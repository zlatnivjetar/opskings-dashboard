'use client';

import { useTheme } from 'next-themes';
import { useMemo } from 'react';

const LIGHT_COLORS = {
  // Chart palette (cycling for pie/donut)
  chart1: '#5b5fc7',
  chart2: '#6b7de8',
  chart3: '#4a5baa',
  chart4: '#5a7ab8',
  chart5: '#5550a0',
  chart6: '#7898b8',
  // Semantic
  created: '#5b5fc7',
  resolved: '#22a06b',
  open: '#d93025',
  inProgress: '#d08800',
  actual: '#5b5fc7',
  expected: '#7898b8',
  // Priority
  urgent: '#b91c1c',
  high: '#dc2626',
  medium: '#d97706',
  low: '#6b7280',
  // Tooltip
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e7eb',
  tooltipText: '#1f2937',
  // Grid / axis
  grid: '#e5e7eb',
  axis: '#6b7280',
};

const DARK_COLORS = {
  chart1: '#7b7ff0',
  chart2: '#8896f5',
  chart3: '#6a7fd8',
  chart4: '#90aad8',
  chart5: '#7070c0',
  chart6: '#b0c8e0',
  created: '#7b7ff0',
  resolved: '#36b37e',
  open: '#ff5c5c',
  inProgress: '#f5c842',
  actual: '#7b7ff0',
  expected: '#b0c8e0',
  urgent: '#ef4444',
  high: '#f87171',
  medium: '#fbbf24',
  low: '#9ca3af',
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

/** Cycle through chart1–chart6 for series that need N colors */
export function chartPalette(colors: ChartColors, count: number): string[] {
  const base = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5, colors.chart6];
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
