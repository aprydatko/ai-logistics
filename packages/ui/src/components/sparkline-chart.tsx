'use client';

import * as React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

import { cn } from '@repo/ui/lib/utils';

type SparklineChartProps = {
  className?: string;
  color: string;
  data: number[];
  label: string;
  valueLabel?: string;
};

export function SparklineChart({
  className,
  color,
  data,
  label,
  valueLabel = label,
}: SparklineChartProps): React.JSX.Element {
  const gradientId = React.useId();
  const chartData = data.map((value, index) => ({
    label: `Point ${index + 1}`,
    value,
  }));

  return (
    <div
      aria-label={label}
      className={cn('h-11 w-full min-w-0', className)}
      role="img"
    >
      <ResponsiveContainer
        height="100%"
        initialDimension={{ height: 44, width: 256 }}
        width="100%"
      >
        <AreaChart
          data={chartData}
          margin={{ bottom: 2, left: 1, right: 1, top: 2 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['dataMin - 3', 'dataMax + 3']} hide />
          <Tooltip
            contentStyle={{
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
            }}
            cursor={false}
            formatter={(value) => [value, valueLabel]}
            labelFormatter={() => ''}
          />
          <Area
            dataKey="value"
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
