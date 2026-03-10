'use client';

import type { CSSProperties } from 'react';
import type { ChartColors } from '@/hooks/use-chart-theme';

export function tooltipStyle(colors: ChartColors): CSSProperties {
  return {
    background: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: 8,
    fontSize: 12,
  };
}

interface Entry {
  name: string;
  value: number | string;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}

interface TooltipContentProps {
  active?: boolean;
  payload?: readonly Entry[];
  label?: string;
}

type ValueFormatter = (value: number | string, name: string, entry: Entry) => string;

export function makeTooltip(colors: ChartColors, valueFormatter?: ValueFormatter) {
  const container: CSSProperties = {
    background: colors.tooltipBg,
    border: `1px solid ${colors.tooltipBorder}`,
    borderRadius: 8,
    fontSize: 12,
    padding: '8px 12px',
  };

  return function TooltipContent({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null;

    return (
      <div style={container}>
        {label && (
          <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: colors.tooltipText }}>
            {label}
          </p>
        )}
        {payload.map((entry, i) => {
          const displayValue = valueFormatter
            ? valueFormatter(entry.value, entry.name, entry)
            : typeof entry.value === 'number'
            ? entry.value.toLocaleString()
            : String(entry.value);

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: i > 0 ? 4 : 0,
                color: colors.tooltipText,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: entry.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1 }}>{entry.name}</span>
              <span style={{ fontWeight: 600, paddingLeft: 12 }}>{displayValue}</span>
            </div>
          );
        })}
      </div>
    );
  };
}
