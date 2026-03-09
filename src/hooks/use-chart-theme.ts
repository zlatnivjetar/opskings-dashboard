'use client';

import { useTheme } from 'next-themes';
import { useMemo } from 'react';

const LIGHT_COLORS = {
  chart1: '#5b5fc7',
  chart2: '#6b7de8',
  chart3: '#4a5baa',
  chart4: '#5a7ab8',
  chart5: '#5550a0',
  chart6: '#7898b8',
  created: '#5b5fc7',
  resolved: '#22a06b',
  open: '#d93025',
  inProgress: '#d08800',
  actual: '#5b5fc7',
  expected: '#7898b8',
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
};

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  return useMemo(
    () => (resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS),
    [resolvedTheme]
  );
}
